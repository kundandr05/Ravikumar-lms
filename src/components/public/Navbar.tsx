'use client';

import Link from 'next/link';
import Image from 'next/image';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { appUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="RaviClasses Logo" width={32} height={32} className="rounded-md" />
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                Ravi<span className="text-amber-600">Classes</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="text-slate-600 hover:text-slate-900 font-medium">Home</Link>
            <Link href="/about" className="text-slate-600 hover:text-slate-900 font-medium">About</Link>
            <Link href="/courses" className="text-slate-600 hover:text-slate-900 font-medium">Courses</Link>
            <Link href="/results" className="text-slate-600 hover:text-slate-900 font-medium">Results</Link>
            <Link href="/reviews" className="text-slate-600 hover:text-slate-900 font-medium">Reviews</Link>
            <Link href="/contact" className="text-slate-600 hover:text-slate-900 font-medium">Contact</Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {appUser ? (
              <Link href={`/dashboard/${appUser.role}`} className={buttonVariants()}>Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: "ghost" })}>Login</Link>
                <Link href="/enroll" className={buttonVariants({ className: "bg-amber-600 hover:bg-amber-700" })}>Enroll Now</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50">Home</Link>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50">About</Link>
            <Link href="/courses" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50">Courses</Link>
            <Link href="/results" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50">Results</Link>
            <Link href="/reviews" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50">Reviews</Link>
            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50">Contact</Link>
            
            <div className="mt-4 pt-4 border-t px-3 space-y-2">
              {appUser ? (
                <Link href={`/dashboard/${appUser.role}`} className={buttonVariants({ className: "w-full" })}>Dashboard</Link>
              ) : (
                <>
                  <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>Login</Link>
                  <Link href="/enroll" className={buttonVariants({ className: "w-full bg-amber-600 hover:bg-amber-700" })}>Enroll Now</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
