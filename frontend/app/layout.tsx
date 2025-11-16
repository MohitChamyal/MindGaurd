import './globals.css';
import type { Metadata } from 'next';
import { Roboto, Poppins, Montserrat } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import dynamic from 'next/dynamic';

// Client component for conditional rendering of the chatbot
const ChatbotWrapper = dynamic(
  () => import('@/components/chatbot/ChatbotWrapper'),
  { ssr: false }
);

const roboto = Roboto({ 
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'], 
  variable: '--font-roboto' 
});
const poppins = Poppins({ 
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-poppins'
});
const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-montserrat'
});

export const metadata: Metadata = {
  title: 'MindGuard - AI-Powered Mental Health Support',
  description: 'Accessible, Affordable, and Stigma-Free mental health support powered by AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${poppins.variable} ${montserrat.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
        >
          {children}
          <Toaster />
          <ChatbotWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}