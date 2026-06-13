
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | RaviClasses LMS",
  description: "Access your RaviClasses student or admin dashboard to continue your learning journey.",
  alternates: {
    canonical: "https://ravikumar-lms.vercel.app/login",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
      