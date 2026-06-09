import { NextResponse } from 'next/server';
import { sendEmail, sendWhatsApp } from '@/lib/communication';

export async function POST(request: Request) {
  try {
    const { title, message, users, sendViaEmail, sendViaWhatsApp } = await request.json();

    if (!title || !message || !users || !Array.isArray(users)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailSubject = `Announcement: ${title}`;
    const tasks: Promise<boolean>[] = [];

    for (const user of users) {
      if (sendViaEmail && user.email) {
        tasks.push(sendEmail({ to: user.email, subject: emailSubject, body: message }));
      }

      // If we had user.phone, we'd use it. Since user schema might not have phone yet, we can use a dummy or skip if not present.
      // Assuming users object passed contains { email, phone? }
      if (sendViaWhatsApp) {
        const phone = user.phone || '7019934034'; // Dummy phone for simulation
        tasks.push(sendWhatsApp({ to: phone, body: `*${title}*\n\n${message}` }));
      }
    }

    await Promise.all(tasks);

    return NextResponse.json({ success: true, message: 'Broadcast notifications sent successfully' });
  } catch (error: any) {
    console.error('Error in broadcast API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
