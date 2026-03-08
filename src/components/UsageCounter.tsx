import Link from 'next/link';

interface UsageCounterProps {
  clipsUsed: number;
  clipsLimit: number;
  plan: 'FREE' | 'PRO';
}

export default function UsageCounter({ clipsUsed, clipsLimit, plan }: UsageCounterProps) {
  if (plan === 'PRO') {
    return (
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Pro Plan - Unlimited Clips
            </h3>
            <p className="text-sm text-gray-600">
              You have unlimited clip generation available
            </p>
          </div>
          <div className="flex items-center">
            <svg
              className="h-10 w-10 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const percentage = (clipsUsed / clipsLimit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = clipsUsed >= clipsLimit;

  return (
    <div
      className={`rounded-lg border p-6 ${
        isAtLimit
          ? 'bg-red-50 border-red-200'
          : isNearLimit
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Clip Usage</h3>
          <p className="text-sm text-gray-600">
            {clipsUsed} of {clipsLimit} clips used this month
          </p>
        </div>
        {isAtLimit && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Limit Reached
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${
              isAtLimit
                ? 'bg-red-600'
                : isNearLimit
                ? 'bg-yellow-600'
                : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Action */}
      {isAtLimit ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-red-800 font-medium">
            You've reached your monthly limit. Upgrade to Pro for unlimited clips.
          </p>
          <Link
            href="/dashboard/billing"
            className="ml-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 font-semibold text-sm whitespace-nowrap shadow-sm hover:shadow-md transition-all duration-150"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Upgrade to Pro
          </Link>
        </div>
      ) : isNearLimit ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-yellow-800 font-medium">
            You're running low on clips. Consider upgrading to Pro.
          </p>
          <Link
            href="/dashboard/billing"
            className="ml-4 inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 font-semibold text-sm whitespace-nowrap hover:bg-blue-50 rounded-lg transition-colors"
          >
            View Plans
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
