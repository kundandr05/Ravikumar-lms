'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await addDoc(collection(db, 'contactMessages'), {
        name,
        email,
        phone,
        message,
        createdAt: serverTimestamp(),
      });

      // Send notification to admin
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 bg-muted/50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about our courses or enrollment process? We're here to help!
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-12">

          {/* Contact Info */}
          <div className="w-full md:w-1/3 space-y-8">
            <Card className="border-0 shadow-lg bg-primary text-primary-foreground">
              <CardContent className="p-8 space-y-8">
                <h3 className="text-2xl font-bold">Get in Touch</h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <svg className="w-6 h-6 mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <div>
                      <h4 className="font-bold">Phone</h4>
                      <p className="text-amber-100">+91 7019934034</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <svg className="w-6 h-6 mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <div>
                      <h4 className="font-bold">Email</h4>
                      <a href="mailto:kundandr05@gmail.com" className="text-amber-100 hover:text-primary-foreground transition-colors underline-offset-4 hover:underline">kundandr05@gmail.com</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <svg className="w-6 h-6 mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <div>
                      <h4 className="font-bold">Location</h4>
                      <p className="text-amber-100">Mysuru Karnataka, India</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-amber-500">
                  <a
                    href="https://wa.me/917019934034"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-primary-foreground px-4 py-3 rounded-md hover:bg-green-600 transition-colors font-bold"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.891-4.444 9.893-9.892.001-5.447-4.445-9.89-9.893-9.89-5.448 0-9.888 4.444-9.89 9.892-.001 2.282.596 4.413 1.705 6.275l-1.096 4.004 4.195-1.091zm10.741-7.514c-.595-.298-3.525-1.741-4.072-1.94-.547-.198-.946-.298-1.343.298-.398.596-1.54 1.94-1.888 2.338-.348.398-.696.447-1.292.149-3.235-1.62-5.412-3.136-7.465-5.96-.247-.348.114-.341.696-1.503.149-.298.075-.558-.037-.806-.112-.248-1.343-3.236-1.84-4.428-.485-1.156-.976-1.001-1.343-1.018-.348-.016-.747-.016-1.144-.016-.398 0-1.045.149-1.592.746-1.144 1.243-4.375 4.275-4.375 10.436s4.474 12.131 5.096 12.977c.622.846 8.847 13.501 21.433 18.932 2.997 1.29 5.334 2.062 7.18 2.639 3.007.95 5.748.815 7.915.494 2.408-.358 7.414-3.031 8.459-5.96.104-.298.104-.558.075-.612-.029-.054-.109-.086-.298-.18z" /></svg>
                    Message on WhatsApp
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="w-full md:w-2/3">
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-foreground">Send us a Message</h3>

                {success ? (
                  <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-6 text-center space-y-4">
                    <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h4 className="text-xl font-bold">Message Sent Successfully!</h4>
                    <p>Thank you for reaching out. We will get back to you within 24 hours.</p>
                    <Button variant="outline" onClick={() => setSuccess(false)}>Send Another Message</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Your Message *</Label>
                      <Textarea id="message" required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help you?" />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button type="submit" className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-primary-foreground px-8" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
