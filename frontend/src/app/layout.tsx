import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ReduxProvider from '@/components/ReduxProvider';
import FloatingNavbar from '@/components/FloatingNavbar';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GrowEasy CSV Importer — AI-Powered CRM Lead Import',
  description:
    'Upload any CSV from Facebook Ads, Google Ads, Excel, or any source. Gemini AI intelligently maps your columns to GrowEasy CRM fields in seconds.',
  keywords: 'CRM, lead import, CSV importer, AI, GrowEasy, Gemini',
  openGraph: {
    title: 'GrowEasy CSV Importer',
    description: 'AI-Powered CRM Lead Import — Any CSV, Any Format',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={inter.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ReduxProvider>
            <FloatingNavbar />
            {children}
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
