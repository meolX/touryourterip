import twilio from 'twilio';
import config from '../config/index.js';

let _isConfigured = null;

/**
 * Check if Twilio SMS is configured.
 * @returns {boolean}
 */
export const isSMSConfigured = () => {
  if (_isConfigured !== null) return _isConfigured;
  _isConfigured = !!(
    config.TWILIO_ACCOUNT_SID &&
    config.TWILIO_AUTH_TOKEN &&
    config.TWILIO_PHONE_NUMBER
  );
  return _isConfigured;
};

/**
 * Generic SMS sender.
 * Logs output to console when Twilio credentials are not set.
 * @param {object} options
 * @param {string} options.to Recipient phone number (E.164 formatted)
 * @param {string} options.body SMS message content
 * @returns {Promise<boolean>} True if sent, false otherwise
 */
export const sendSMS = async ({ to, body }) => {
  if (!isSMSConfigured()) {
    console.log(`[MOCK SMS] Sending to: ${to}`);
    console.log(`[MOCK SMS] Body: ${body}`);
    return true;
  }

  try {
    const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body,
      to,
      from: config.TWILIO_PHONE_NUMBER,
    });
    console.log(`[SMS] SMS successfully sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`[SMS] Failed to send SMS to ${to}:`, error.message);
    return false;
  }
};

/**
 * Send OTP verification SMS.
 */
export const sendOTPSMS = async (phone, otp) => {
  return sendSMS({
    to: phone,
    body: `Your TourYourTrip verification code is: ${otp}. Valid for 10 minutes.`,
  });
};

/**
 * Send booking confirmation SMS.
 */
export const sendBookingConfirmationSMS = async (phone, details) => {
  return sendSMS({
    to: phone,
    body: `Booking Confirmed! Stay: ${details.propertyName}, Dates: ${details.checkIn} to ${details.checkOut}. Amount: ${details.currency} ${details.amount}.`,
  });
};
