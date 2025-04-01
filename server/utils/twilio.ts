import twilio from 'twilio';

// Initialize Twilio client with environment variables
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client: any = null;

// Initialize the Twilio client if credentials are available
if (twilioAccountSid && twilioAuthToken) {
  client = twilio(twilioAccountSid, twilioAuthToken);
}

/**
 * Send SMS message using Twilio
 * @param to Phone number to send message to
 * @param body Message content
 * @returns Promise resolving to message SID if successful
 */
export async function sendSMS(to: string, body: string): Promise<string> {
  try {
    // If Twilio isn't configured, log the message instead of sending
    if (!client || !twilioPhoneNumber) {
      console.log(`[SMS SIMULATION] To: ${to}, Message: ${body}`);
      return 'SMS_SIMULATED';
    }
    
    // Send the actual SMS
    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to
    });
    
    return message.sid;
  } catch (error) {
    console.error('Error sending SMS:', error);
    // Don't throw the error, just log it so it doesn't break the application flow
    return 'SMS_FAILED';
  }
}
