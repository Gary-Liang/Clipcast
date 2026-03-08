/**
 * Stripe pricing configuration
 */

export const STRIPE_CONFIG = {
  plans: {
    free: {
      name: 'Free',
      price: 0,
      clipsLimit: 3,
      features: [
        '3 video clips per month',
        '9:16 vertical format',
        'Animated waveform',
        'Word-level captions',
        'MP4 download',
      ],
    },
    pro: {
      name: 'Pro',
      price: 29,
      priceId: process.env.STRIPE_PRICE_ID_PRO!,
      clipsLimit: -1, // -1 means unlimited
      features: [
        'Unlimited video clips',
        '9:16 vertical format',
        'Animated waveform',
        'Word-level captions',
        'MP4 download',
        'Priority processing',
        'Email support',
      ],
    },
  },
};

export type PlanType = keyof typeof STRIPE_CONFIG.plans;
