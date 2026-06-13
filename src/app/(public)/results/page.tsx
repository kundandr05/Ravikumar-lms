import { Metadata } from "next";
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: "Student Results | RaviClasses",
  description: "View the outstanding board exam results and success stories of our Class 10 students at RaviClasses.",
  alternates: {
    canonical: "https://ravikumar-lms.vercel.app/results",
  }
};

export default function ResultsPage() {
  const toppers = [
    { name: "Priya Sharma", score: "99%", subject: "Social Science", year: "2025" },
    { name: "Rahul Verma", score: "98%", subject: "English", year: "2025" },
    { name: "Sneha Patel", score: "98%", subject: "Social Science", year: "2024" },
    { name: "Aditya Singh", score: "97%", subject: "English", year: "2024" },
    { name: "Neha Gupta", score: "97%", subject: "Social Science", year: "2024" },
    { name: "Karan Kumar", score: "96%", subject: "English", year: "2023" },
  ];

  return (
    <div className="py-20 bg-muted/50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">Our Hall of Fame</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Consistent 100% success rate with top scorers in CBSE Class 10 Board Exams year after year.
          </p>
        </div>

        {/* Highlight Banner */}
        <div className="bg-amber-600 rounded-3xl p-8 md:p-12 text-center text-primary-foreground shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Highest Score Achieved</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 mt-8">
            <div className="space-y-2">
              <span className="text-6xl md:text-8xl font-black">99</span>
              <span className="text-2xl md:text-3xl font-bold">%</span>
              <p className="text-amber-100 text-lg">in Social Science</p>
            </div>
            <div className="hidden md:block w-px h-24 bg-amber-400"></div>
            <div className="space-y-2">
              <span className="text-6xl md:text-8xl font-black">98</span>
              <span className="text-2xl md:text-3xl font-bold">%</span>
              <p className="text-amber-100 text-lg">in English</p>
            </div>
          </div>
        </div>

        {/* Toppers Grid */}
        <div className="space-y-8">
          <h3 className="text-3xl font-bold text-foreground text-center">Recent Top Performers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {toppers.map((topper, idx) => (
              <Card key={idx} className="border-t-4 border-t-slate-800 text-center hover:-translate-y-1 transition-transform">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto flex items-center justify-center text-muted-foreground">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground">{topper.name}</h4>
                    <p className="text-sm text-muted-foreground">Class of {topper.year}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-3xl font-black text-primary">{topper.score}</span>
                    <p className="text-sm font-medium text-foreground">{topper.subject}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
