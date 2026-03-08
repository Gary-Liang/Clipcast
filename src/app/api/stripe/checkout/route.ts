import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { STRIPE_CONFIG } from '@/lib/stripe/config';
import { requireUser } from '@/lib/auth/user';
import { prisma } from '@/lib/db/client';
import logger from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser();

    logger.info({ userId: user.id }, 'Creating Stripe checkout session');

    // Check if user is already on Pro plan
    if (user.plan === 'PRO') {
      return NextResponse.json(
        { error: 'You are already subscribed to the Pro plan' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
          clerkId: user.clerkId,
        },
      });

      customerId = customer.id;

      // Save Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });

      logger.info({ userId: user.id, customerId }, 'Created Stripe customer');
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_CONFIG.plans.pro.priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?upgrade=success`,
      cancel_url: `${appUrl}/dashboard?upgrade=cancelled`,
      metadata: {
        userId: user.id,
        clerkId: user.clerkId,
      },
    });

    logger.info({ userId: user.id, sessionId: session.id }, 'Checkout session created');

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error({ error }, 'Stripe checkout error');

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
