import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SND Rental Management System",
  description: "Comprehensive rental management system for equipment and property rentals",
  keywords: ["rental", "management", "equipment", "property", "business"],
  authors: [{ name: "SND Development Team" }],
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <Providers>
          <SidebarProvider
            defaultOpen={true}
            style={
              {
                "--sidebar-width": "16rem",
                "--header-height": "4rem",
              } as React.CSSProperties
            }
          >
            <div className="flex h-screen w-full overflow-hidden bg-background">
              <AppSidebar />
              <SidebarInset className="flex-1 flex flex-col min-w-0 overflow-hidden peer">
                <SiteHeader />
                <main className="flex-1 overflow-auto p-6 transition-all duration-200 ease-linear">
                  <div className="w-full h-full max-w-none">
                    {children}
                  </div>
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </Providers>
      </body>
    </html>
  );
}
