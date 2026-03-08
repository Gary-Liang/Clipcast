import Link from 'next/link';
import { STRIPE_CONFIG } from '@/lib/stripe/config';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

// Static page, revalidate every 5 minutes
export const revalidate = 300;

export default async function Home() {
  // Redirect signed-in users to dashboard
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Turn Your Podcast Into
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">
                Viral Clips
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              AI-powered platform that transforms your podcast episodes into engaging
              short-form videos for TikTok, Instagram Reels, and YouTube Shorts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-8 py-4 rounded-lg hover:from-teal-600 hover:to-cyan-600 font-medium text-lg shadow-lg transition-all"
              >
                Get Started Free
              </Link>
              <Link
                href="#how-it-works"
                className="bg-white text-gray-900 px-8 py-4 rounded-lg hover:bg-gray-50 font-medium text-lg border-2 border-gray-200 transition-all"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              From Podcast to Viral Clips in Minutes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered pipeline handles everything automatically
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Upload</h3>
              <p className="text-gray-600">
                Upload your podcast MP3 file to our secure platform
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Transcribe</h3>
              <p className="text-gray-600">
                AI generates timestamped transcript with speaker detection
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Detect</h3>
              <p className="text-gray-600">
                AI identifies 3-5 viral-worthy moments from your episode
              </p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Generate</h3>
              <p className="text-gray-600">
                Download 9:16 videos with animated waveforms and captions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Go Viral
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI-Powered Clip Detection
              </h3>
              <p className="text-gray-600">
                Our AI analyzes your entire episode to find the most engaging, viral-worthy moments
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Animated Waveforms
              </h3>
              <p className="text-gray-600">
                Eye-catching audio visualizations that keep viewers engaged from start to finish
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Word-Level Captions
              </h3>
              <p className="text-gray-600">
                Perfectly synced captions that highlight each word as it's spoken
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                9:16 Vertical Format
              </h3>
              <p className="text-gray-600">
                Optimized for TikTok, Instagram Reels, and YouTube Shorts
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Fast Processing
              </h3>
              <p className="text-gray-600">
                Get your clips ready in minutes, not hours
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                High Quality Output
              </h3>
              <p className="text-gray-600">
                Download professional MP4 videos ready to upload
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Start free, upgrade when you're ready
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {STRIPE_CONFIG.plans.free.name}
              </h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">
                  ${STRIPE_CONFIG.plans.free.price}
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {STRIPE_CONFIG.plans.free.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block w-full text-center bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-medium"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg shadow-xl border-2 border-teal-500 p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {STRIPE_CONFIG.plans.pro.name}
              </h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">
                  ${STRIPE_CONFIG.plans.pro.price}
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {STRIPE_CONFIG.plans.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-6 w-6 text-teal-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block w-full text-center bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-lg hover:from-teal-600 hover:to-cyan-600 font-medium"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-teal-500 to-cyan-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Grow Your Audience?
          </h2>
          <p className="text-xl text-teal-50 mb-8">
            Join podcasters who are turning their episodes into viral clips
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-white text-teal-600 px-8 py-4 rounded-lg hover:bg-gray-100 font-medium text-lg shadow-lg transition-all"
          >
            Start Creating Clips Now
          </Link>
        </div>
      </section>
    </div>
  );
}
