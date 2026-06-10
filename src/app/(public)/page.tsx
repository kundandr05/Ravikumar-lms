import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TestimonialsCarousel } from '@/components/public/TestimonialsCarousel';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Master Class 10 with Ravikumar\'s Expert Guidance. 17+ Years of Excellence in English & Social Science.',
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-slate-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Master Class 10 with <br className="hidden md:block"/>
            <span className="text-amber-600">Ravikumar's Expert Guidance</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
            <div className="space-y-2">
               <h2 className="text-4xl font-bold text-white">17+</h2>
               <p className="text-amber-100 font-medium">Years Experience</p>
            </div>
            <div className="space-y-5">
               <h2 className="text-4xl font-bold text-white">500+</h2>
               <p className="text-amber-100 font-medium">Students Mentored</p>
            </div>
            <div className="space-y-5">
               <h2 className="text-4xl font-bold text-white">2</h2>
               <p className="text-amber-100 font-medium">Core Subjects</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="bg-slate-900 py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-[1px] bg-slate-800"></div>
            </div>
            <div className="relative inline-block bg-slate-900 px-10 py-3 border-2 border-amber-500">
              <h2 className="text-3xl font-bold text-amber-500 tracking-wider">WHAT YOU GET</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {/* 1 */}
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="w-24 h-24 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-slate-800/50">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/><polygon fill="currentColor" points="16,14 17.5,17 21,17.5 18.5,20 19,23 16,21.5 13,23 13.5,20 11,17.5 14.5,17" /></svg>
              </div>
              <h3 className="text-lg font-bold text-amber-500 uppercase tracking-widest leading-snug">Individual<br/>Attention</h3>
              <p className="text-slate-300">Personalized learning as per your needs</p>
            </div>

            {/* 2 */}
            <div className="flex flex-col items-center text-center space-y-5 relative">
              <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-32 bg-slate-800"></div>
              <div className="w-24 h-24 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-slate-800/50">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polygon points="10 8 15 10 10 12 10 8" fill="currentColor"/></svg>
              </div>
              <h3 className="text-lg font-bold text-amber-500 uppercase tracking-widest leading-snug">Live Interactive<br/>Sessions</h3>
              <p className="text-slate-300">Engaging & easy to understand</p>
            </div>

            {/* 3 */}
            <div className="flex flex-col items-center text-center space-y-5 relative">
              <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-32 bg-slate-800"></div>
              <div className="w-24 h-24 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-slate-800/50">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <h3 className="text-lg font-bold text-amber-500 uppercase tracking-widest leading-snug">Exam Focused<br/>Preparation</h3>
              <p className="text-slate-300 px-4">CBSE pattern, important questions & sample papers</p>
            </div>

            {/* 4 */}
            <div className="flex flex-col items-center text-center space-y-5 relative">
              <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-32 bg-slate-800"></div>
              <div className="w-24 h-24 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-slate-800/50">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/><polyline points="16 7 22 3 22 9"/></svg>
              </div>
              <h3 className="text-lg font-bold text-amber-500 uppercase tracking-widest leading-snug">Regular Tests<br/>& Feedback</h3>
              <p className="text-slate-300">Track your progress and improve consistently</p>
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
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Meet Ravikumar D</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                With over 17 years of dedicated teaching experience, Ravikumar D has transformed the way students approach Class 10 Board Exams. Specializing in English and Social Science, his unique methodology focuses on deep conceptual clarity rather than rote memorization.
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

      {/* Testimonials Section */}
      <TestimonialsCarousel />

      {/* CTA Section */}
      <section className="bg-slate-900 py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Secure Your Board Results?</h2>
          <p className="text-xl text-slate-300">Enroll today and get immediate access to premium video lectures, notes, and MCQ tests.</p>
          <Link href="/enroll" className={buttonVariants({ size: "lg", className: "!bg-amber-500 hover:!bg-amber-600 !text-slate-900 font-bold text-lg px-10 py-6" })}>Enroll Now for 2026 Batch</Link>
        </div>
      </section>
    </div>
  );
}
