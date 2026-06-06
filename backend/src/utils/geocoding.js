import config from '../config/index.js';

/**
 * Check if Geocoding API is configured.
 * @returns {boolean}
 */
export const isGeocodingConfigured = () => {
  return !!config.GOOGLE_MAPS_API_KEY;
};

/**
 * Geocode address to latitude/longitude.
 * Returns default/mock coordinates if not configured or on failure.
 * @param {string} addressLine1
 * @param {string} city
 * @param {string} state
 * @param {string} country
 * @returns {Promise<{latitude: number, longitude: number, formatted_address: string}>}
 */
export const geocodeAddress = async (addressLine1, city, state, country) => {
  if (!isGeocodingConfigured()) {
    return {
      latitude: 12.9716,
      longitude: 77.5946,
      formatted_address: `${addressLine1}, ${city}, ${state}, ${country}`
    };
  }

  const query = encodeURIComponent(`${addressLine1}, ${city}, ${state}, ${country}`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${config.GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: data.results[0].formatted_address
      };
    } else {
      console.warn(`[GEOCODING] Geocoding API returned status: ${data.status}. Returning fallback.`);
      return {
        latitude: 12.9716,
        longitude: 77.5946,
        formatted_address: `${addressLine1}, ${city}, ${state}, ${country}`
      };
    }
  } catch (error) {
    console.error('[GEOCODING] Geocoding failed:', error.message);
    return {
      latitude: 12.9716,
      longitude: 77.5946,
      formatted_address: `${addressLine1}, ${city}, ${state}, ${country}`
    };
  }
};

/**
 * Reverse geocode latitude/longitude to address components.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{city: string, state: string, country: string}>}
 */
export const reverseGeocode = async (latitude, longitude) => {
  if (!isGeocodingConfigured()) {
    return {
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    };
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${config.GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const addressComponents = data.results[0].address_components;
      let city = '';
      let state = '';
      let country = '';

      for (const component of addressComponents) {
        const types = component.types;
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        } else if (types.includes('country')) {
          country = component.long_name;
        }
      }

      return { city, state, country };
    } else {
      console.warn(`[GEOCODING] Reverse geocoding returned status: ${data.status}. Returning fallback.`);
      return {
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India'
      };
    }
  } catch (error) {
    console.error('[GEOCODING] Reverse geocoding failed:', error.message);
    return {
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    };
  }
};
