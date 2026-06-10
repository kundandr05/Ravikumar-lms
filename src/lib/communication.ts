/**
 * Communication Utilities
 * 
 * This file contains functions to handle sending Emails using Nodemailer
 * and WhatsApp messages (currently simulated).
 */
import nodemailer from 'nodemailer';

export interface SendMessageOptions {
  to: string; // Email address or Phone number
  subject?: string; // For Email
  body: string;
}

export async function sendEmail({ to, subject = 'Notification', body }: SendMessageOptions): Promise<boolean> {
  try {
    // If we are missing environment variables, fallback to simulation so the app doesn't break
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ EMAIL_USER or EMAIL_PASS not found in .env.local! Falling back to SIMULATION.");
      console.log(`✉️ SIMULATED EMAIL TO: ${to}\nSUBJECT: ${subject}\nBODY:\n${body}`);
      return true;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Ravi Classes" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: body,
      // You can add HTML here later if you want formatted emails
      // html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

export async function sendWhatsApp({ to, body }: SendMessageOptions): Promise<boolean> {
  // Override for testing based on user request
  const testPhone = '7019934034';
  try {
    // SIMULATION
    console.log('\n==================================================');
    console.log(`💬 SIMULATED WHATSAPP SENT TO: ${testPhone} (Original: ${to})`);
    console.log(`BODY: \n${body}`);
    console.log('==================================================\n');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp:', error);
    return false;
  }
}
