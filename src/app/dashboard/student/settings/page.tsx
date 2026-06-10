'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function StudentSettingsPage() {
  const { appUser } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentStatus, setSentStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !subject) return;

    setSending(true);
    setSentStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: appUser?.name || 'Student',
          email: appUser?.email || 'Unknown Email',
          phone: '',
          message: `SUBJECT: ${subject}\n\n${message}`,
        }),
      });

      if (response.ok) {
        setSentStatus('success');
        setSubject('');
        setMessage('');
      } else {
        setSentStatus('error');
      }
    } catch (error) {
      console.error('Error sending support request:', error);
      setSentStatus('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings & Support</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and contact the admin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Name</Label>
                <div className="font-medium text-slate-900">{appUser?.name}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Email Address</Label>
                <div className="font-medium text-slate-900">{appUser?.email}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Role</Label>
                <div className="font-medium text-slate-900 capitalize">{appUser?.role}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact Admin / Support</CardTitle>
              <CardDescription>
                Need help with a course, assignment, or experiencing technical issues? Send a message directly to the administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentStatus === 'success' && (
                <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-bold">Message Sent!</h4>
                    <p className="text-sm">The admin has received your message and will reply to your email address soon.</p>
                  </div>
                </div>
              )}
              
              {sentStatus === 'error' && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                  Failed to send message. Please try again later.
                </div>
              )}

              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject" 
                    placeholder="E.g. Issue with Video Playback, Question about Assignment" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">How can we help you?</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Describe your issue or question in detail..." 
                    className="min-h-[150px]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full md:w-auto" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Message to Admin'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
