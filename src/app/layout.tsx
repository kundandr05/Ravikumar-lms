import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Ravi Classes',
    default: 'Ravi Classes - CBSE Class 10 Excellence',
  },
  description: "Empowering CBSE Class 10 students with 17+ years of teaching excellence in English and Social Science.",
  keywords: ["CBSE", "Class 10", "English", "Social Science", "Ravi Classes", "Online Learning", "Mysuru"],
  openGraph: {
    title: 'Ravi Classes',
    description: 'Empowering CBSE Class 10 students with 17+ years of teaching excellence in English and Social Science.',
    url: 'https://raviclasses.com',
    siteName: 'Ravi Classes',
    locale: 'en_IN',
    type: 'website',
  },
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
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
