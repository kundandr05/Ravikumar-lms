
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | RaviClasses LMS",
  description: "Create an account at RaviClasses to enroll in Class 10 courses and access premium study materials.",
  alternates: {
    canonical: "https://ravikumar-lms.vercel.app/register",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
      