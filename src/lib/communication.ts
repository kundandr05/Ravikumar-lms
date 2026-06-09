/**
 * Communication Utilities
 * 
 * This file contains functions to handle sending Emails and WhatsApp messages.
 * Currently, these are SIMULATED (mocked) and will only log to the server console.
 * To make them real, integrate Nodemailer/Resend for Email and Twilio/Meta API for WhatsApp.
 */

export interface SendMessageOptions {
  to: string; // Email address or Phone number
  subject?: string; // For Email
  body: string;
}

export async function sendEmail({ to, subject = 'Notification', body }: SendMessageOptions): Promise<boolean> {
  // Override for testing based on user request
  const testEmail = 'kundandr05@gmail.com';
  try {
    // SIMULATION
    console.log('\n==================================================');
    console.log(`✉️  SIMULATED EMAIL SENT TO: ${testEmail} (Original: ${to})`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY: \n${body}`);
    console.log('==================================================\n');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
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
