import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripeClient(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }

  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  });

  return stripeInstance;
}

// Export as a getter to enable lazy initialization
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const client = getStripeClient();
    return client[prop as keyof Stripe];
  }
});
