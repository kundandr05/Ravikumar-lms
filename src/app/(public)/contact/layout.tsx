import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | RaviClasses',
  description: 'Get in touch with RaviClasses for admission inquiries, support, and guidance for Class 10 coaching.',
  alternates: {
    canonical: 'https://ravikumar-lms.vercel.app/contact',
  }
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
