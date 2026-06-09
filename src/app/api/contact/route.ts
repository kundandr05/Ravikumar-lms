import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/communication';

export async function POST(request: Request) {
  try {
    const { name, email, phone, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminEmail = 'kundandr05@gmail.com';
    const emailSubject = `New Contact Form Submission from ${name}`;
    const messageBody = `You have received a new message from the contact form.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nMessage:\n${message}`;

    await sendEmail({ to: adminEmail, subject: emailSubject, body: messageBody });

    return NextResponse.json({ success: true, message: 'Contact email sent successfully' });
  } catch (error: any) {
    console.error('Error in contact API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
