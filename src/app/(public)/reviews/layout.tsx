
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Reviews | RaviClasses",
  description: "Read what parents and students have to say about their learning experience with RaviClasses.",
  alternates: {
    canonical: "https://ravikumar-lms.vercel.app/reviews",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
      