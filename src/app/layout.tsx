
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
  title: 'LifeQuest: Gamifica Tu Vida',
  description: '¡Gamifica tu vida y alcanza tus metas con LifeQuest!',
  manifest: '/manifest.json', 
  themeColor: '#E53935', 
  icons: {
    apple: 'https://placehold.co/180x180.png?text=LQApple', 
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
