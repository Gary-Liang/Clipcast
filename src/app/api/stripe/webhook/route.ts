import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/client';
import { prisma } from '@/lib/db/client';
import logger from '@/utils/logger';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    logger.error({ error }, 'Webhook signature verification failed');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        logger.info({ eventType: event.type }, 'Unhandled Stripe webhook event');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error, eventType: event.type }, 'Webhook processing error');
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;

  if (!userId) {
    logger.error({ sessionId: session.id }, 'No userId in checkout session metadata');
    return;
  }

  logger.info({ userId, sessionId: session.id }, 'Checkout completed, upgrading user to PRO');

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: 'PRO',
      stripeCustomerId: session.customer as string,
      clipsUsed: 0, // Reset usage when upgrading
    },
  });

  logger.info({ userId }, 'User upgraded to PRO');
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    logger.error({ customerId }, 'User not found for subscription update');
    return;
  }

  // If subscription is active, ensure user is on PRO plan
  if (subscription.status === 'active') {
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: 'PRO' },
    });

    logger.info({ userId: user.id }, 'Subscription updated to active');
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    logger.error({ customerId }, 'User not found for subscription deletion');
    return;
  }

  logger.info({ userId: user.id }, 'Subscription cancelled, downgrading to FREE');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: 'FREE',
      clipsUsed: 0, // Reset usage
      clipsLimit: 3, // Reset to free tier limit
    },
  });

  logger.info({ userId: user.id }, 'User downgraded to FREE');
}
