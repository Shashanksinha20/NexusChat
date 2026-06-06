import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NexusChat – Real-time Group & Direct Messaging',
  description:
    'A scalable real-time chat app with direct messaging, group channels, RBAC roles, and live presence. Built with Next.js, Socket.io, Redis, and PostgreSQL.',
  keywords: ['chat', 'real-time', 'messaging', 'group chat', 'socket.io'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
