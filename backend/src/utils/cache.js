import getRedis from '../db/redis.js';

/**
 * Get item from cache.
 * Returns null if not found or if Redis is not configured/fails.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export const cacheGet = async (key) => {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const val = await redis.get(key);
    if (!val) return null;
    return JSON.parse(val);
  } catch (error) {
    console.error(`[CACHE] Failed to get key "${key}":`, error.message);
    return null;
  }
};

/**
 * Set item in cache with TTL (in seconds).
 * @param {string} key
 * @param {any} data
 * @param {number} ttl Default 300 seconds (5 minutes)
 * @returns {Promise<boolean>}
 */
export const cacheSet = async (key, data, ttl = 300) => {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const serializedData = JSON.stringify(data);
    await redis.set(key, serializedData, 'EX', ttl);
    return true;
  } catch (error) {
    console.error(`[CACHE] Failed to set key "${key}":`, error.message);
    return false;
  }
};

/**
 * Delete item from cache.
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export const cacheDel = async (key) => {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`[CACHE] Failed to delete key "${key}":`, error.message);
    return false;
  }
};

/**
 * Delete keys matching a pattern using non-blocking SCAN.
 * @param {string} pattern E.g. 'property:*'
 * @returns {Promise<boolean>}
 */
export const cacheDelPattern = async (pattern) => {
  const redis = getRedis();
  if (!redis) return false;

  try {
    let cursor = '0';
    let keysToDelete = [];
    
    // Scan recursively to collect keys without blocking Redis server
    do {
      const reply = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = reply[0];
      const keys = reply[1];
      if (keys && keys.length > 0) {
        keysToDelete.push(...keys);
      }
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
    }
    return true;
  } catch (error) {
    console.error(`[CACHE] Failed to delete pattern "${pattern}":`, error.message);
    return false;
  }
};
