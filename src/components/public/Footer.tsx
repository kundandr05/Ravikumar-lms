import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Ravi<span className="text-amber-500">Classes</span>
            </h3>
            <p className="text-sm">
              Empowering CBSE Class 10 students with 17+ years of teaching excellence in English and Social Science.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-amber-500 transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-amber-500 transition-colors">About Sir</Link></li>
              <li><Link href="/courses" className="hover:text-amber-500 transition-colors">Courses</Link></li>
              <li><Link href="/results" className="hover:text-amber-500 transition-colors">Results</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/reviews" className="hover:text-amber-500 transition-colors">Reviews</Link></li>
              <li><Link href="/contact" className="hover:text-amber-500 transition-colors">Contact Us</Link></li>
              <li><Link href="/login" className="hover:text-amber-500 transition-colors">Student Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">Contact Info</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                +91 7019934034
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <a href="mailto:kundandr05@gmail.com" className="hover:text-amber-500 transition-colors">kundandr05@gmail.com</a>
              </li>
            </ul>
            <a
              href="https://wa.me/917019934034"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.891-4.444 9.893-9.892.001-5.447-4.445-9.89-9.893-9.89-5.448 0-9.888 4.444-9.89 9.892-.001 2.282.596 4.413 1.705 6.275l-1.096 4.004 4.195-1.091zm10.741-7.514c-.595-.298-3.525-1.741-4.072-1.94-.547-.198-.946-.298-1.343.298-.398.596-1.54 1.94-1.888 2.338-.348.398-.696.447-1.292.149-3.235-1.62-5.412-3.136-7.465-5.96-.247-.348.114-.341.696-1.503.149-.298.075-.558-.037-.806-.112-.248-1.343-3.236-1.84-4.428-.485-1.156-.976-1.001-1.343-1.018-.348-.016-.747-.016-1.144-.016-.398 0-1.045.149-1.592.746-1.144 1.243-4.375 4.275-4.375 10.436s4.474 12.131 5.096 12.977c.622.846 8.847 13.501 21.433 18.932 2.997 1.29 5.334 2.062 7.18 2.639 3.007.95 5.748.815 7.915.494 2.408-.358 7.414-3.031 8.459-5.96.104-.298.104-.558.075-.612-.029-.054-.109-.086-.298-.18z" /></svg>
              Chat on WhatsApp
            </a>
          </div>

        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ravi Classes. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
