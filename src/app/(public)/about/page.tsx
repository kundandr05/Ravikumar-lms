import { Card, CardContent } from '@/components/ui/card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Ravi Sir',
  description: 'Learn more about Ravikumar D, his 17+ years of teaching experience, and his proven methodology for CBSE Class 10 success.',
};

export default function AboutPage() {
  return (
    <div className="py-20 bg-muted/50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">About Ravikumar D</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A passionate educator dedicated to shaping the future of Class 10 students through innovative teaching methodologies.
          </p>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/3 aspect-square bg-slate-200 rounded-2xl shadow-md flex items-center justify-center text-muted-foreground shrink-0">
            {/* Image Placeholder */}
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="w-full md:w-2/3 space-y-6">
            <h2 className="text-2xl font-bold text-foreground border-b pb-2">Profile Overview</h2>
            <p className="text-foreground leading-relaxed">
              With an illustrious career spanning over 17 years, Ravikumar D has established himself as a premier educator for Class 10 CBSE students. Specializing in English and Social Science, he has guided thousands of students to achieve outstanding board exam results, turning complex historical events and intricate English literature into engaging, easy-to-understand narratives.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Qualifications</h4>
                    <p className="text-sm text-muted-foreground">M.A. (English), B.Ed</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Experience</h4>
                    <p className="text-sm text-muted-foreground">17+ Years in Education</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Teaching Methodology */}
        <div className="space-y-8 pt-8 border-t">
          <h2 className="text-3xl font-bold text-foreground text-center">Teaching Methodology</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-t-4 border-t-amber-500">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-foreground">Conceptual Clarity</h3>
                <p className="text-muted-foreground">Moving beyond rote memorization to ensure students deeply understand the 'why' and 'how' of every topic.</p>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-amber-500">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-foreground">Exam-Oriented Approach</h3>
                <p className="text-muted-foreground">Strategic preparation aligned exactly with the latest CBSE board patterns and marking schemes.</p>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-amber-500">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-foreground">Interactive Learning</h3>
                <p className="text-muted-foreground">Engaging visual presentations and real-world examples that make Social Science and English come alive.</p>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
