
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LifeQuestProvider } from '@/hooks/use-life-quest-store';
import { AuthProvider } from '@/hooks/use-auth'; // Import AuthProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LifeQuest RPG',
  description: 'Gamify your life with LifeQuest RPG!',
  manifest: '/manifest.json', // Link to the manifest file
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <meta name="theme-color" content="#E53935" /> {/* Corresponds to manifest theme_color */}
        <link rel="apple-touch-icon" href="https://placehold.co/180x180.png?text=LQApple" /> {/* Placeholder Apple touch icon */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans overflow-x-hidden`}>
        <AuthProvider> {/* Wrap with AuthProvider */}
          <LifeQuestProvider>
            {children}
            <Toaster />
          </LifeQuestProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
