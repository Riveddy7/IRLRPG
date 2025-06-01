
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LifeQuestProvider } from '@/hooks/use-life-quest-store';
import { AuthProvider } from '@/hooks/use-auth'; 

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RPLife: Gamifica Tu Vida',
  description: '¡Gamifica tu vida y alcanza tus metas con RPLife!',
  manifest: '/manifest.json', 
  themeColor: '#E53935', 
  icons: {
    apple: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/android-chrome-192x192.png?alt=media&token=c25e3afc-1789-4728-9a0a-c0fb411e1b42', 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" style={{ colorScheme: 'dark' }}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans overflow-x-hidden`}>
        <AuthProvider> 
          <LifeQuestProvider>
            {children}
            <Toaster />
          </LifeQuestProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
