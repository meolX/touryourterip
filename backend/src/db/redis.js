import Redis from 'ioredis';
import config from '../config/index.js';

let _instance = null;
let _isConfigured = null;

/**
 * Check if Redis is configured.
 * @returns {boolean}
 */
export const isRedisConfigured = () => {
  if (_isConfigured !== null) return _isConfigured;
  _isConfigured = !!config.REDIS_URL;
  return _isConfigured;
};

/**
 * Get the Redis client instance.
 * Returns null if not configured or if initialization fails.
 * @returns {Redis|null}
 */
const getRedis = () => {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!_instance) {
    try {
      // Connect to Redis with lazyConnect to prevent synchronous errors on startup
      _instance = new Redis(config.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 100, 3000);
          return delay;
        }
      });

      _instance.on('error', (err) => {
        console.error('[REDIS] Connection error:', err.message);
      });

      _instance.on('connect', () => {
        console.log('[REDIS] Client connected successfully');
      });

      // Attempt to connect asynchronously, catching connection errors
      _instance.connect().catch((err) => {
        console.error('[REDIS] Asynchronous connection failed:', err.message);
      });
    } catch (error) {
      console.error('[REDIS] Failed to initialize Redis client:', error.message);
      _instance = null;
    }
  }

  return _instance;
};

export default getRedis;
