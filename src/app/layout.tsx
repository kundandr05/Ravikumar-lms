import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import PwaRegister from "@/components/PwaRegister";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ravikumar-lms.vercel.app'),
  title: {
    template: '%s | Ravi Classes',
    default: 'RaviClasses LMS | Class 10 Expert Coaching',
  },
  description: "RaviClasses LMS provides expert coaching for Class 10 students with courses, study materials, online tests, progress tracking, and live learning support.",
  keywords: ["Class 10 Coaching", "Online LMS", "Ravi Classes", "English Coaching", "Social Science Coaching", "Board Exam Preparation", "Student Learning Platform", "Online Classes India"],
  authors: [{ name: "RaviClasses" }],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://ravikumar-lms.vercel.app',
  },
  openGraph: {
    title: 'RaviClasses LMS | Class 10 Expert Coaching',
    description: 'RaviClasses LMS provides expert coaching for Class 10 students with courses, study materials, online tests, progress tracking, and live learning support.',
    url: 'https://ravikumar-lms.vercel.app',
    siteName: 'RaviClasses',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'RaviClasses LMS - Class 10 Excellence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RaviClasses LMS | Class 10 Expert Coaching',
    description: 'RaviClasses LMS provides expert coaching for Class 10 students with courses, study materials, online tests, progress tracking, and live learning support.',
    images: ['/og-image.jpg'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ravi Classes',
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    google: "XtvQrMqwocoPPcBLOxSBX3ztlEz3enX_Fm6tLfNZATY",
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground dark:bg-slate-900 dark:text-slate-100 transition-colors">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "EducationalOrganization",
                  "@id": "https://ravikumar-lms.vercel.app/#organization",
                  "name": "RaviClasses",
                  "url": "https://ravikumar-lms.vercel.app",
                  "logo": "https://ravikumar-lms.vercel.app/icons/icon-512x512.png",
                  "sameAs": []
                },
                {
                  "@type": "WebSite",
                  "@id": "https://ravikumar-lms.vercel.app/#website",
                  "url": "https://ravikumar-lms.vercel.app",
                  "name": "RaviClasses LMS",
                  "publisher": {
                    "@id": "https://ravikumar-lms.vercel.app/#organization"
                  }
                }
              ]
            })
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PwaRegister />
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
