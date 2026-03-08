import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import "./globals.css";

export const metadata: Metadata = {
  title: "Clipcast - Turn Podcasts Into Viral Clips",
  description: "AI-powered platform that transforms your podcast episodes into engaging short-form videos for TikTok, Instagram Reels, and YouTube Shorts.",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icon_square_256.png', sizes: '256x256', type: 'image/png' },
      { url: '/icon_square_512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple_touch_icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-gray-50 min-h-screen flex flex-col">
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
            {children}
          </main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
