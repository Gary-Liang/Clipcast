import { requireUser } from '@/lib/auth/user';
import { redirect } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import Link from 'next/link';

export default async function UploadPage() {
  const user = await requireUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 shadow-sm hover:shadow mb-4"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-4">Upload Podcast</h1>
        <p className="text-gray-600">
          Upload your podcast episode to generate viral clips
        </p>
      </div>

      {/* Usage Info */}
      <div className={`rounded-lg border p-6 mb-8 ${
        user.plan === 'PRO'
          ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200'
          : user.clipsUsed >= user.clipsLimit
          ? 'bg-red-50 border-red-200'
          : 'bg-teal-50 border-teal-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                user.plan === 'PRO'
                  ? 'bg-teal-100'
                  : user.clipsUsed >= user.clipsLimit
                  ? 'bg-red-100'
                  : 'bg-cyan-100'
              }`}>
                {user.plan === 'PRO' ? (
                  <svg className="h-5 w-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ) : user.clipsUsed >= user.clipsLimit ? (
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <h3 className={`text-sm font-semibold mb-1 ${
                user.plan === 'PRO'
                  ? 'text-teal-900'
                  : user.clipsUsed >= user.clipsLimit
                  ? 'text-red-900'
                  : 'text-cyan-900'
              }`}>
                {user.plan === 'PRO' ? 'Pro Plan - Unlimited Clips' : user.clipsUsed >= user.clipsLimit ? 'Clip Limit Reached' : 'Starter Plan'}
              </h3>
              <p className={`text-sm ${
                user.plan === 'PRO'
                  ? 'text-teal-700'
                  : user.clipsUsed >= user.clipsLimit
                  ? 'text-red-700'
                  : 'text-cyan-700'
              }`}>
                {user.plan === 'FREE'
                  ? user.clipsUsed >= user.clipsLimit
                    ? `You've used all ${user.clipsLimit} free clips this month.`
                    : `${user.clipsLimit - user.clipsUsed} of ${user.clipsLimit} free clips remaining this month.`
                  : 'Generate unlimited clips with your Pro subscription.'}
              </p>
            </div>
          </div>
          {user.plan === 'FREE' && (
            <Link
              href="/dashboard/billing"
              className="flex-shrink-0 ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-sm hover:shadow-md transition-all duration-150"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {user.clipsUsed >= user.clipsLimit ? 'Upgrade Now' : 'Upgrade to Pro'}
            </Link>
          )}
        </div>
      </div>

      {/* Upload Form */}
      <div className="flex justify-center">
        <FileUpload />
      </div>

      {/* How It Works */}
      <div className="mt-12 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <div className="bg-cyan-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-cyan-600 font-bold text-lg">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Upload</h3>
            <p className="text-sm text-gray-600">
              Select your podcast MP3 file (up to 150MB)
            </p>
          </div>

          <div>
            <div className="bg-teal-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-teal-600 font-bold text-lg">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Transcribe</h3>
            <p className="text-sm text-gray-600">
              AI generates timestamped transcript (~5-10 min)
            </p>
          </div>

          <div>
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-green-600 font-bold text-lg">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Detect Clips</h3>
            <p className="text-sm text-gray-600">
              AI finds 3-5 viral-worthy moments (~1-2 min)
            </p>
          </div>

          <div>
            <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-yellow-600 font-bold text-lg">4</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Generate Videos</h3>
            <p className="text-sm text-gray-600">
              Download 9:16 videos ready for social media
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
