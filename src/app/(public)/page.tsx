import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-slate-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Master Class 10 with <br className="hidden md:block"/>
            <span className="text-amber-600">Ravi Sir's Expert Guidance</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            17+ Years of Excellence in English & Social Science. Join the premier learning platform designed to guarantee your board exam success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/enroll" className={buttonVariants({ size: "lg", className: "bg-amber-600 hover:bg-amber-700 text-lg px-8 py-6" })}>Start Learning Today</Link>
            <Link href="/demo" className={buttonVariants({ size: "lg", variant: "outline", className: "text-lg px-8 py-6" })}>Watch Free Demos</Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-amber-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-white">17+</h2>
              <p className="text-amber-100 font-medium">Years Experience</p>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-white">5000+</h2>
              <p className="text-amber-100 font-medium">Students Mentored</p>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-white">100%</h2>
              <p className="text-amber-100 font-medium">Success Rate</p>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-white">2</h2>
              <p className="text-amber-100 font-medium">Core Subjects</p>
            </div>
          </div>
        </div>
      </section>

      {/* Teacher Profile Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2 aspect-square max-w-md bg-slate-200 rounded-2xl overflow-hidden relative shadow-lg">
              {/* Placeholder for Ravi Sir's photo */}
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Meet Ravi Sir</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                With over 17 years of dedicated teaching experience, Ravi Sir has transformed the way students approach Class 10 Board Exams. Specializing in English and Social Science, his unique methodology focuses on deep conceptual clarity rather than rote memorization.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-slate-700">
                  <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Proven track record of board toppers
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Interactive and engaging teaching style
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Comprehensive study materials provided
                </li>
              </ul>
              <Link href="/about" className={buttonVariants({ variant: "outline", className: "mt-4" })}>Read Full Profile</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Highlights */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Subjects Offered</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Master the most crucial subjects for your Class 10 Board Exams with specialized curriculum.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-amber-500">
              <CardContent className="p-8 space-y-4 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-amber-600">EN</span>
                </div>
                <h3 className="text-2xl font-bold">Class 10 English</h3>
                <p className="text-slate-600">Complete literature syllabus, grammar, writing skills, and reading comprehension.</p>
                <Link href="/courses" className={buttonVariants({ variant: "ghost", className: "text-amber-600 hover:text-amber-700 mt-4" })}>View Syllabus &rarr;</Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-amber-500">
              <CardContent className="p-8 space-y-4 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-amber-600">SST</span>
                </div>
                <h3 className="text-2xl font-bold">Class 10 Social Science</h3>
                <p className="text-slate-600">In-depth coverage of History, Geography, Political Science, and Economics.</p>
                <Link href="/courses" className={buttonVariants({ variant: "ghost", className: "text-amber-600 hover:text-amber-700 mt-4" })}>View Syllabus &rarr;</Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Secure Your Board Results?</h2>
          <p className="text-xl text-slate-300">Enroll today and get immediate access to premium video lectures, notes, and MCQ tests.</p>
          <Link href="/enroll" className={buttonVariants({ size: "lg", className: "bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-lg px-10 py-6" })}>Enroll Now for 2026 Batch</Link>
        </div>
      </section>
    </div>
  );
}
