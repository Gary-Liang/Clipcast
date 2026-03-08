import { requireUser } from '@/lib/auth/user';
import { prisma } from '@/lib/db/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UpgradeButton from '@/components/UpgradeButton';
import UsageCounter from '@/components/UsageCounter';
import FileUpload from '@/components/FileUpload';

// Revalidate every 60 seconds to cache database queries
export const revalidate = 60;

export default async function DashboardPage() {
  const user = await requireUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Get user's recent jobs with clips (limited to 20 for performance)
  const jobs = await prisma.job.findMany({
    where: {
      userId: user.id,
    },
    include: {
      clips: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20, // Limit to 20 most recent jobs
  });

  // Calculate total clips
  const totalClips = jobs.reduce((sum, job) => sum + job.clips.length, 0);
  const completedClips = jobs.reduce(
    (sum, job) => sum + job.clips.filter((clip) => clip.status === 'COMPLETE').length,
    0
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {user.name || user.email}!
            </p>
          </div>
        </div>

        {/* Prominent Upload CTA */}
        <Link
          href="/dashboard/upload"
          className="block w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-8 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-white mb-1">Upload New Podcast</h3>
                <p className="text-teal-50">Turn your episode into viral clips in minutes</p>
              </div>
            </div>
            <svg className="h-8 w-8 text-white/80 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Usage Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Jobs</h3>
          <p className="text-3xl font-bold text-gray-900">{jobs.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Clips Generated</h3>
          <p className="text-3xl font-bold text-gray-900">{completedClips}</p>
        </div>

        <div className={`rounded-lg shadow-sm border p-6 ${
          user.plan === 'PRO'
            ? 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {user.plan === 'PRO' ? (
                  <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <h3 className="text-sm font-medium text-gray-600">Your Plan</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-bold ${
                  user.plan === 'PRO' ? 'text-teal-700' : 'text-gray-900'
                }`}>
                  {user.plan === 'PRO' ? 'Pro' : 'Starter'}
                </p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  user.plan === 'PRO'
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.plan === 'PRO' ? '∞ Unlimited' : `${user.clipsLimit} clips/month`}
                </span>
              </div>
              {user.plan === 'FREE' && (
                <p className="text-xs text-gray-500 mt-2">
                  {user.clipsUsed} of {user.clipsLimit} clips used
                </p>
              )}
            </div>
            {user.plan === 'FREE' && (
              <Link
                href="/dashboard/billing"
                className="flex-shrink-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-sm hover:shadow-md transition-all duration-150"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Upgrade
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Usage Counter */}
      <div className="mb-8">
        <UsageCounter
          clipsUsed={user.clipsUsed}
          clipsLimit={user.clipsLimit}
          plan={user.plan}
        />
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Your Podcast Jobs</h2>
        </div>

        {jobs.length === 0 ? (
          <div className="px-6 py-12">
            <div className="text-center mb-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No podcast jobs yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading your first podcast episode.
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <FileUpload />
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <div key={job.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate" title={job.filename}>
                          {job.filename}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              job.status === 'CLIPS_DETECTED'
                                ? 'bg-green-100 text-green-800'
                                : job.status === 'TRANSCRIPTION_COMPLETE'
                                ? 'bg-blue-100 text-blue-800'
                                : job.status === 'TRANSCRIBING' ||
                                  job.status === 'DETECTING_CLIPS'
                                ? 'bg-yellow-100 text-yellow-800'
                                : job.status === 'FAILED' ||
                                  job.status === 'TRANSCRIPTION_FAILED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              job.status === 'CLIPS_DETECTED'
                                ? 'bg-green-600'
                                : job.status === 'TRANSCRIPTION_COMPLETE'
                                ? 'bg-blue-600'
                                : job.status === 'TRANSCRIBING' ||
                                  job.status === 'DETECTING_CLIPS'
                                ? 'bg-yellow-600 animate-pulse'
                                : job.status === 'FAILED' ||
                                  job.status === 'TRANSCRIPTION_FAILED'
                                ? 'bg-red-600'
                                : 'bg-gray-600'
                            }`}></span>
                            {job.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 ml-12 mt-2">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                      {job.duration && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {Math.floor(job.duration / 60)}:
                          {String(Math.floor(job.duration % 60)).padStart(2, '0')}
                        </span>
                      )}
                      {job.clips.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {job.clips.length} {job.clips.length === 1 ? 'clip' : 'clips'}
                        </span>
                      )}
                    </div>

                    {/* Clips for this job */}
                    {job.clips.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {job.clips.map((clip) => (
                          <Link
                            key={clip.id}
                            href={`/dashboard/clips/${clip.id}`}
                            className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                                {clip.title}
                              </h4>
                              <span
                                className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                  clip.status === 'COMPLETE'
                                    ? 'bg-green-100 text-green-800'
                                    : clip.status === 'GENERATING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : clip.status === 'FAILED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {clip.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {Math.floor(clip.startTime / 60)}:
                              {String(Math.floor(clip.startTime % 60)).padStart(2, '0')} -{' '}
                              {Math.floor(clip.endTime / 60)}:
                              {String(Math.floor(clip.endTime % 60)).padStart(2, '0')}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="flex-shrink-0 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    View Details
                    <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
