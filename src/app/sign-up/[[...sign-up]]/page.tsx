import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg',
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
        />

        <p className="mt-6 text-center text-sm text-gray-600">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-teal-600 hover:text-teal-700 font-medium">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-teal-600 hover:text-teal-700 font-medium">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
