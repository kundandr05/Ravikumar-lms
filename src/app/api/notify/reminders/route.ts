import { NextResponse } from 'next/server';
import { sendEmail, sendWhatsApp } from '@/lib/communication';

export async function POST(request: Request) {
  try {
    const { type, message, users, sendViaEmail, sendViaWhatsApp } = await request.json();

    if (!type || !message || !users || !Array.isArray(users)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let emailSubject = 'Reminder';
    if (type === 'test') emailSubject = 'Test Reminder';
    else if (type === 'fee') emailSubject = 'Fee Payment Reminder';
    else if (type === 'assignment') emailSubject = 'Assignment Reminder';

    const tasks: Promise<boolean>[] = [];

    for (const user of users) {
      if (sendViaEmail && user.email) {
        tasks.push(sendEmail({ to: user.email, subject: emailSubject, body: message }));
      }

      if (sendViaWhatsApp) {
        const phone = user.phone || '7019934034'; // Dummy phone
        tasks.push(sendWhatsApp({ to: phone, body: `*${emailSubject}*\n\n${message}` }));
      }
    }

    await Promise.all(tasks);

    return NextResponse.json({ success: true, message: 'Reminders sent successfully' });
  } catch (error: any) {
    console.error('Error in reminders API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
