import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers'; 
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] }); 

// Force dynamic rendering to prevent SSR issues with authentication
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SND Rental Management System',
  description: 'SND Rental Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
