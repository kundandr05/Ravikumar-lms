import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

export default function CoursesPage() {
  return (
    <div className="py-20 bg-muted/50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">Our Premium Courses</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive syllabus coverage designed to help you secure 95%+ in your Class 10 Board Exams.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          
          {/* English Course */}
          <Card className="border-t-4 border-t-amber-500 shadow-lg">
            <CardHeader className="bg-muted border-b pb-8 pt-8 text-center space-y-4">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-3xl font-bold text-primary">EN</span>
              </div>
              <CardTitle className="text-3xl">Class 10 English</CardTitle>
              <p className="text-muted-foreground">Language and Literature</p>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">Syllabus Coverage</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span><strong>First Flight (Prose & Poetry):</strong> Detailed line-by-line explanation and thematic analysis.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span><strong>Footprints Without Feet:</strong> Character sketches and plot summaries.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span><strong>Grammar & Writing Skills:</strong> Letters, Analytical Paragraphs, Tenses, Modals.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span><strong>Reading Comprehension:</strong> Strategies for unseen passages.</span>
                  </li>
                </ul>
              </div>
              <Link href="/enroll" className={buttonVariants({ className: "w-full bg-amber-600 hover:bg-amber-700", size: "lg" })}>Enroll in English</Link>
            </CardContent>
          </Card>

          {/* Social Science Course */}
          <Card className="border-t-4 border-t-amber-500 shadow-lg">
            <CardHeader className="bg-muted border-b pb-8 pt-8 text-center space-y-4">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-3xl font-bold text-primary">SST</span>
              </div>
              <CardTitle className="text-3xl">Class 10 Social Science</CardTitle>
              <p className="text-muted-foreground">History, Geography, Civics & Economics</p>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">Syllabus Coverage</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span><strong>History:</strong> India and the Contemporary World-II. Complete timelines and map work.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span><strong>Geography:</strong> Contemporary India-II. Resource distribution and agriculture.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span><strong>Civics (Political Science):</strong> Democratic Politics-II. Power sharing and federalism.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span><strong>Economics:</strong> Understanding Economic Development.</span>
                  </li>
                </ul>
              </div>
              <Link href="/enroll" className={buttonVariants({ className: "w-full bg-amber-600 hover:bg-amber-700", size: "lg" })}>Enroll in Social Science</Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
