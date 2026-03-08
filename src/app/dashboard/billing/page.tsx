import { requireUser } from '@/lib/auth/user';
import { STRIPE_CONFIG } from '@/lib/stripe/config';
import { redirect } from 'next/navigation';

export default async function BillingPage() {
  const user = await requireUser();

  if (!user) {
    redirect('/sign-in');
  }

  const currentPlan = STRIPE_CONFIG.plans[user.plan.toLowerCase() as 'free' | 'pro'];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Subscription</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {currentPlan.name}
              {user.plan === 'PRO' && (
                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
                  Active
                </span>
              )}
            </p>
            <p className="text-gray-600 mt-1">
              {user.plan === 'FREE'
                ? `${user.clipsUsed} / ${user.clipsLimit} clips used this month`
                : 'Unlimited clips'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              ${currentPlan.price}
              <span className="text-base font-normal text-gray-600">/month</span>
            </p>
          </div>
        </div>

        {user.plan === 'FREE' && (
          <div className="mt-6">
            <form action="/api/stripe/checkout" method="POST">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-lg hover:from-teal-600 hover:to-cyan-600 font-medium"
              >
                Upgrade to Pro
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {STRIPE_CONFIG.plans.free.name}
          </h3>
          <p className="text-3xl font-bold text-gray-900 mb-4">
            ${STRIPE_CONFIG.plans.free.price}
            <span className="text-base font-normal text-gray-600">/month</span>
          </p>
          <ul className="space-y-3">
            {STRIPE_CONFIG.plans.free.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro Plan */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-teal-500 p-6 relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Popular
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {STRIPE_CONFIG.plans.pro.name}
          </h3>
          <p className="text-3xl font-bold text-gray-900 mb-4">
            ${STRIPE_CONFIG.plans.pro.price}
            <span className="text-base font-normal text-gray-600">/month</span>
          </p>
          <ul className="space-y-3">
            {STRIPE_CONFIG.plans.pro.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <svg
                  className="h-5 w-5 text-teal-500 mr-2 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
