/**
 * Simulated Notification Service
 * For MVP, this just logs to the console.
 * Can be hooked up to Twilio/SendGrid later.
 */

export const NotificationService = {
  async sendSms(mobile: string, message: string) {
    console.log('\n=============================================');
    console.log(`✉️  [SMS to +91${mobile}]`);
    console.log(`   ${message}`);
    console.log('=============================================\n');
  },
  
  async sendEmail(email: string, subject: string, body: string) {
    console.log('\n=============================================');
    console.log(`📧 [EMAIL to ${email}]`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${body}`);
    console.log('=============================================\n');
  }
};
