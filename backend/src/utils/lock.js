import crypto from 'crypto';
import getRedis from '../db/redis.js';

/**
 * Acquire a distributed lock.
 * Returns a lock token if successful, or null if lock is already held.
 * If Redis is not configured, returns a mock token (allows execution to proceed).
 * @param {string} key Lock key name
 * @param {number} ttlSeconds Expiry time for the lock in seconds
 * @returns {Promise<string|null>} Lock token or null
 */
export const acquireLock = async (key, ttlSeconds = 10) => {
  const redis = getRedis();
  if (!redis) {
    // Graceful degradation: Redis is down or not configured.
    // Return a mock token to allow the caller to proceed.
    return `mock-token-${crypto.randomUUID()}`;
  }

  const token = crypto.randomUUID();
  try {
    const result = await redis.set(key, token, 'NX', 'EX', ttlSeconds);
    if (result === 'OK') {
      return token;
    }
    return null;
  } catch (error) {
    console.error(`[LOCK] Failed to acquire lock for key "${key}":`, error.message);
    // On Redis error, allow proceeding so we don't block critical booking operations
    return `error-fallback-token-${crypto.randomUUID()}`;
  }
};

/**
 * Release a distributed lock.
 * Only releases the lock if the token matches (prevents releasing someone else's lock).
 * @param {string} key Lock key name
 * @param {string} token Lock token that was returned from acquireLock
 * @returns {Promise<boolean>} True if released, false otherwise
 */
export const releaseLock = async (key, token) => {
  if (!token) return false;

  // If it's a mock or fallback token, just return true
  if (token.startsWith('mock-token-') || token.startsWith('error-fallback-token-')) {
    return true;
  }

  const redis = getRedis();
  if (!redis) return false;

  // Use atomic Lua script to compare token and delete in one command
  const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  try {
    const result = await redis.eval(luaScript, 1, key, token);
    return result === 1;
  } catch (error) {
    console.error(`[LOCK] Failed to release lock for key "${key}":`, error.message);
    return false;
  }
};
