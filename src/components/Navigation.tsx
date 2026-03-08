'use client';

import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import ClipUsageIndicator from './ClipUsageIndicator';

export default function Navigation() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between h-12">
          <SignedOut>
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image src="/logo.svg" alt="Clipcast" width={193} height={56} priority className="h-14 w-auto" />
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
              <Image src="/logo.svg" alt="Clipcast" width={193} height={56} priority className="h-14 w-auto" />
            </Link>
          </SignedIn>

          <div className="flex items-center gap-3">
            <SignedOut>
              <Link
                href="/sign-in"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 shadow-sm hover:shadow-md transition-all duration-150"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Get Started
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 shadow-sm hover:shadow-md transition-all duration-150"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload
              </Link>
              <ClipUsageIndicator />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 border-2 border-gray-200 hover:border-gray-300 transition-colors',
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
