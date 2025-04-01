import { randomBytes } from 'crypto';
import { ServiceRequest } from '@shared/schema';
import { sendSMS } from './twilio';

/**
 * Generate a secure random token for quote verification
 * @returns Random token string
 */
export function generateQuoteToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Format a currency amount for display
 * @param amount Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericAmount);
}

/**
 * Send a quote SMS notification to a customer
 * @param serviceRequest The service request object
 * @param baseUrl The base URL of the application for the confirmation link
 * @returns Promise resolving to the message SID
 */
export async function sendQuoteSMS(
  serviceRequest: ServiceRequest,
  baseUrl: string
): Promise<string> {
  if (!serviceRequest.quoteToken || !serviceRequest.quotedAmount) {
    throw new Error('Service request is missing quote information');
  }

  const formattedAmount = formatCurrency(serviceRequest.quotedAmount);
  const confirmationLink = `${baseUrl}/quote/confirm/${serviceRequest.quoteToken}`;
  
  // Format expiry date if available
  let expiryInfo = '';
  if (serviceRequest.quoteExpiryDate) {
    const expiryDate = new Date(serviceRequest.quoteExpiryDate);
    expiryInfo = ` This quote is valid until ${expiryDate.toLocaleDateString()}.`;
  }
  
  const message = 
    `LKR Construction: Your quote for ${serviceRequest.serviceType} service is ${formattedAmount}.${expiryInfo}\n\n` +
    `To accept this quote, please click: ${confirmationLink}\n\n` +
    `If you have questions, please call us at (337) 123-4567.`;
  
  return await sendSMS(serviceRequest.phone, message);
}

/**
 * Get the client-facing URL for the application
 * Can be overridden with CLIENT_URL environment variable
 */
export function getClientUrl(): string {
  return process.env.CLIENT_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://lkrconstruction.com' 
      : 'http://localhost:5000');
}