import { NextResponse } from 'next/server';
import { sendEmail, sendWhatsApp } from '@/lib/communication';

export async function POST(request: Request) {
  try {
    const { studentName, email, phone, courseTitle, sendViaEmail, sendViaWhatsApp } = await request.json();

    if (!studentName || !courseTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailSubject = `Welcome to ${courseTitle}!`;
    const messageBody = `Hello ${studentName},\n\nYou have successfully enrolled in ${courseTitle}. We are excited to have you on board!\n\nBest regards,\nYour Learning Management System`;

    const tasks: Promise<boolean>[] = [];

    if (sendViaEmail && email) {
      tasks.push(sendEmail({ to: email, subject: emailSubject, body: messageBody }));
    }

    if (sendViaWhatsApp && phone) {
      tasks.push(sendWhatsApp({ to: phone, body: messageBody }));
    }

    await Promise.all(tasks);

    return NextResponse.json({ success: true, message: 'Enrollment notifications sent successfully' });
  } catch (error: any) {
    console.error('Error in enrollment notification API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
