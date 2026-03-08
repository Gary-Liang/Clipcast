import type { Metadata } from "next";
import Navigation from '@/components/Navigation';
import "./globals.css";

export const metadata: Metadata = {
  title: "Podcast to Clips",
  description: "Convert audio podcasts into short-form video clips for TikTok, Reels, and Shorts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
