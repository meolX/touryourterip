import sgMail from '@sendgrid/mail';
import config from '../config/index.js';

let _isConfigured = null;

/**
 * Check if SendGrid email delivery is configured.
 * @returns {boolean}
 */
export const isEmailConfigured = () => {
  if (_isConfigured !== null) return _isConfigured;
  _isConfigured = !!config.SENDGRID_API_KEY;
  return _isConfigured;
};

/**
 * Generic email sender.
 * Logs email data to console as mock output when SendGrid API key is not set.
 * @param {object} options
 * @param {string} options.to Recipient email address
 * @param {string} options.subject Email subject line
 * @param {string} [options.text] Plaintext body
 * @param {string} [options.html] HTML body
 * @param {string} [options.templateId] SendGrid transactional template ID
 * @param {object} [options.dynamicData] Dynamic data dictionary for SendGrid templates
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const sendEmail = async ({ to, subject, text, html, templateId, dynamicData }) => {
  if (!isEmailConfigured()) {
    console.log(`[MOCK EMAIL] Sending to: ${to}`);
    console.log(`[MOCK EMAIL] Subject: ${subject}`);
    if (templateId) {
      console.log(`[MOCK EMAIL] Template ID: ${templateId} | Dynamic Data:`, JSON.stringify(dynamicData, null, 2));
    } else {
      console.log(`[MOCK EMAIL] HTML Body: ${html || '(No HTML)'}`);
      console.log(`[MOCK EMAIL] Text Body: ${text || '(No Text)'}`);
    }
    return true;
  }

  try {
    sgMail.setApiKey(config.SENDGRID_API_KEY);

    const msg = {
      to,
      from: config.SENDGRID_FROM_EMAIL,
      subject,
      ...(templateId
        ? { templateId, dynamicTemplateData: dynamicData }
        : { text, html })
    };

    await sgMail.send(msg);
    console.log(`[EMAIL] Email successfully sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send email to ${to}:`, error.message);
    if (error.response && error.response.body) {
      console.error(`[EMAIL] SendGrid API Error Details:`, JSON.stringify(error.response.body));
    }
    return false;
  }
};

/**
 * Send welcome email to a new user.
 */
export const sendWelcomeEmail = async (email, name) => {
  return sendEmail({
    to: email,
    subject: 'Welcome to TourYourTrip!',
    html: `<h1>Welcome, ${name}!</h1><p>Thank you for signing up for TourYourTrip. We're excited to help you find your next stay!</p>`,
    templateId: process.env.SENDGRID_TEMPLATE_WELCOME,
    dynamicData: { name }
  });
};

/**
 * Send booking confirmation email.
 */
export const sendBookingConfirmation = async (email, name, bookingDetails) => {
  return sendEmail({
    to: email,
    subject: 'Booking Confirmed!',
    html: `<h1>Booking Confirmed!</h1><p>Hi ${name}, your booking for <strong>${bookingDetails.propertyName}</strong> from ${bookingDetails.checkIn} to ${bookingDetails.checkOut} has been confirmed.</p><p>Total Amount: ${bookingDetails.currency} ${bookingDetails.amount}</p>`,
    templateId: process.env.SENDGRID_TEMPLATE_BOOKING,
    dynamicData: { name, ...bookingDetails }
  });
};

/**
 * Send payment receipt email.
 */
export const sendPaymentReceipt = async (email, name, paymentDetails) => {
  return sendEmail({
    to: email,
    subject: 'Payment Receipt',
    html: `<h1>Payment Receipt</h1><p>Hi ${name}, thank you for your payment of ${paymentDetails.currency} ${paymentDetails.amount} for booking ID: ${paymentDetails.bookingId}.</p>`,
    templateId: process.env.SENDGRID_TEMPLATE_PAYMENT,
    dynamicData: { name, ...paymentDetails }
  });
};

/**
 * Send OTP verification email.
 */
export const sendOTPEmail = async (email, otp) => {
  return sendEmail({
    to: email,
    subject: 'Your TourYourTrip Verification Code',
    html: `<p>Your verification code is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
    templateId: process.env.SENDGRID_TEMPLATE_OTP,
    dynamicData: { otp }
  });
};

/**
 * Send password reset email.
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
  return sendEmail({
    to: email,
    subject: 'Reset your TourYourTrip password',
    html: `<p>Please reset your password by using this token: <strong>${resetToken}</strong></p>`,
    templateId: process.env.SENDGRID_TEMPLATE_RESET,
    dynamicData: { resetToken }
  });
};
