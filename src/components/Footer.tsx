import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} Clipcast. All rights reserved. • <span className="text-gray-500">v0.1.0-beta</span>
          </div>

          <div className="flex gap-6 text-sm">
            <a
              href="https://tally.so/r/jaMxLQ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-teal-600 transition-colors font-medium"
            >
              📧 Send Feedback
            </a>
            <Link
              href="/terms"
              className="text-gray-600 hover:text-teal-600 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-teal-600 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
