import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config/index.js';

// ─── Lazy Razorpay Instance ────────────────────────────
// Deferred initialization so the app doesn't crash on
// startup when RAZORPAY_KEY_ID is not yet set in .env.
let _instance = null;

const getRazorpayInstance = () => {
  if (!_instance) {
    if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
      throw new Error(
        'Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env'
      );
    }

    _instance = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });
  }
  return _instance;
};

/**
 * Verify Razorpay payment signature.
 * @see https://razorpay.com/docs/payments/server-integration/nodejs/payment-verification/
 */
export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
};

/**
 * Verify Razorpay webhook signature.
 * @see https://razorpay.com/docs/webhooks/validate-test/
 */
export const verifyWebhookSignature = (body, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
};

export default getRazorpayInstance;
