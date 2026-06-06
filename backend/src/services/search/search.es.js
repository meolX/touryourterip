import getESClient from '../../db/elasticsearch.js';
import config from '../../config/index.js';
import prisma from '../../db/prisma.js';

// ─── HAVERSINE DISTANCE (km) ───────────────────────────
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Search properties in Elasticsearch.
 * Hydrates matches from PostgreSQL to maintain consistent response schemas.
 * @param {object} filters
 * @returns {Promise<object>}
 */
export const esSearchProperties = async (filters) => {
  const client = getESClient();
  const indexName = `${config.ELASTICSEARCH_INDEX_PREFIX}_properties`;

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const from = (page - 1) * limit;

  const must = [];
  const filter = [];
  const mustNot = [];

  // Active status only
  filter.push({ term: { status: 'active' } });

  // 1. Text Search (multi_match on title, description, city, state, country)
  if (filters.q) {
    must.push({
      multi_match: {
        query: filters.q,
        fields: ['title^3', 'description', 'city.text^2', 'state.text^2', 'country'],
        fuzziness: 'AUTO'
      }
    });
  } else {
    // Specific field matches
    if (filters.city) {
      filter.push({ match: { 'city.text': filters.city } });
    }
    if (filters.state) {
      filter.push({ match: { 'state.text': filters.state } });
    }
    if (filters.country) {
      filter.push({ term: { country: filters.country } });
    }
  }

  // 2. Property Type
  if (filters.type) {
    filter.push({ term: { type: filters.type } });
  }

  // 3. Price range (base_price_per_night)
  if (filters.min_price !== undefined || filters.max_price !== undefined) {
    const priceRange = {};
    if (filters.min_price !== undefined) priceRange.gte = parseFloat(filters.min_price);
    if (filters.max_price !== undefined) priceRange.lte = parseFloat(filters.max_price);
    filter.push({ range: { base_price_per_night: priceRange } });
  }

  // 4. Minimum rating
  if (filters.min_rating !== undefined) {
    filter.push({ range: { rating_avg: { gte: parseFloat(filters.min_rating) } } });
  }

  // 5. Room nested filters (guests, has_ac, has_wifi)
  const nestedMust = [{ term: { 'rooms.is_active': true } }];

  if (filters.guests !== undefined) {
    nestedMust.push({ range: { 'rooms.max_guests': { gte: parseInt(filters.guests, 10) } } });
  }
  if (filters.has_ac !== undefined) {
    nestedMust.push({ term: { 'rooms.has_ac': filters.has_ac === 'true' || filters.has_ac === true } });
  }
  if (filters.has_wifi !== undefined) {
    nestedMust.push({ term: { 'rooms.has_wifi': filters.has_wifi === 'true' || filters.has_wifi === true } });
  }

  if (nestedMust.length > 1) {
    filter.push({
      nested: {
        path: 'rooms',
        query: {
          bool: {
            must: nestedMust
          }
        }
      }
    });
  }

  // 6. Geographic / Nearby query
  const isGeoSearch = filters.latitude !== undefined && filters.longitude !== undefined;
  if (isGeoSearch) {
    const radius = parseFloat(filters.radius) || 10; // km
    filter.push({
      geo_distance: {
        distance: `${radius}km`,
        location: {
          lat: parseFloat(filters.latitude),
          lon: parseFloat(filters.longitude)
        }
      }
    });
  }

  // 7. Date Availability check (Query PG, exclude unavailable properties in ES)
  if (filters.check_in && filters.check_out) {
    const checkIn = new Date(filters.check_in);
    const checkOut = new Date(filters.check_out);

    const blockedRooms = await prisma.$queryRawUnsafe(
      `
      SELECT DISTINCT r.property_id
      FROM rooms r
      WHERE r.is_active = true
        AND NOT EXISTS (
          SELECT 1
          FROM rooms r2
          WHERE r2.id = r.id
            AND r2.total_units > (
              SELECT COUNT(*)
              FROM bookings b
              WHERE b.room_id = r2.id
                AND b.status IN ('pending', 'confirmed', 'checked_in')
                AND b.check_in < $2
                AND b.check_out > $1
            )
        )
      `,
      checkIn,
      checkOut
    );

    const unavailablePropertyIds = blockedRooms.map((r) => r.property_id);
    if (unavailablePropertyIds.length > 0) {
      mustNot.push({ terms: { id: unavailablePropertyIds } });
    }
  }

  // Sorting
  const sort = [];
  if (isGeoSearch) {
    sort.push({
      _geo_distance: {
        location: {
          lat: parseFloat(filters.latitude),
          lon: parseFloat(filters.longitude)
        },
        order: 'asc',
        unit: 'km',
        mode: 'min',
        distance_type: 'arc',
        ignore_unmapped: true
      }
    });
  }

  const direction = filters.sort_order || 'desc';
  switch (filters.sort_by) {
    case 'price':
      sort.push({ base_price_per_night: { order: direction } });
      break;
    case 'rating':
      sort.push({ rating_avg: { order: direction } });
      break;
    case 'reviews':
      sort.push({ review_count: { order: direction } });
      break;
    case 'newest':
    default:
      if (!isGeoSearch) {
        sort.push({ created_at: { order: direction } });
      }
      break;
  }

  const queryBody = {
    query: {
      bool: {
        must,
        filter,
        must_not: mustNot
      }
    },
    sort,
    from,
    size: limit
  };

  const response = await client.search({
    index: indexName,
    body: queryBody
  });

  const hits = response.hits.hits;
  const totalCount = typeof response.hits.total === 'number' 
    ? response.hits.total 
    : (response.hits.total?.value || 0);

  if (hits.length === 0) {
    return {
      properties: [],
      pagination: {
        page,
        limit,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      }
    };
  }

  // Hydrate from DB to guarantee identical response payload schema
  const matchingIds = hits.map(hit => hit._source.id);
  const dbProperties = await prisma.property.findMany({
    where: { id: { in: matchingIds } },
    select: {
      id: true,
      title: true,
      type: true,
      city: true,
      state: true,
      country: true,
      latitude: true,
      longitude: true,
      base_price_per_night: true,
      currency: true,
      rating_avg: true,
      review_count: true,
      amenities: true,
      created_at: true,
      photos: {
        where: { is_cover: true },
        select: { url: true, caption: true },
        take: 1
      },
      rooms: {
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          room_type: true,
          price_per_night: true,
          max_guests: true,
          has_ac: true,
          has_wifi: true
        },
        orderBy: { price_per_night: 'asc' },
        take: 3
      }
    }
  });

  // Re-sort to match the order returned by ES (important for relevance/distance sorts)
  const dbMap = new Map(dbProperties.map(p => [p.id, p]));
  const hydrated = matchingIds
    .map(id => dbMap.get(id))
    .filter(Boolean)
    .map(p => {
      const distance_km = (isGeoSearch && p.latitude && p.longitude)
        ? Math.round(haversineDistance(parseFloat(filters.latitude), parseFloat(filters.longitude), p.latitude, p.longitude) * 100) / 100
        : undefined;

      const mapped = {
        ...p,
        cover_photo: p.photos[0] || null,
        starting_price: p.rooms[0]?.price_per_night ?? p.base_price_per_night
      };
      delete mapped.photos;

      if (distance_km !== undefined) {
        mapped.distance_km = distance_km;
      }
      return mapped;
    });

  const totalPages = Math.ceil(totalCount / limit);

  return {
    properties: hydrated,
    pagination: {
      page,
      limit,
      total: totalCount,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1
    }
  };
};

/**
 * Autocomplete suggestions utilizing Elasticsearch match_phrase_prefix queries.
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const esSuggestions = async (query, limit = 5) => {
  const client = getESClient();
  const indexName = `${config.ELASTICSEARCH_INDEX_PREFIX}_properties`;

  const response = await client.search({
    index: indexName,
    body: {
      query: {
        bool: {
          must: [
            { term: { status: 'active' } }
          ],
          should: [
            { match_phrase_prefix: { title: { query } } },
            { match_phrase_prefix: { city: { query } } },
            { match_phrase_prefix: { state: { query } } }
          ],
          minimum_should_match: 1
        }
      },
      size: limit * 2
    }
  });

  const hits = response.hits.hits.map(h => h._source);
  const suggestions = [];
  const citiesSeen = new Set();
  const statesSeen = new Set();

  for (const doc of hits) {
    if (doc.city && !citiesSeen.has(doc.city.toLowerCase())) {
      citiesSeen.add(doc.city.toLowerCase());
      suggestions.push({
        type: 'city',
        label: `${doc.city}, ${doc.state}`,
        value: doc.city,
        meta: { state: doc.state, country: doc.country }
      });
    }

    if (doc.state && !statesSeen.has(doc.state.toLowerCase())) {
      statesSeen.add(doc.state.toLowerCase());
      suggestions.push({
        type: 'state',
        label: `${doc.state}, ${doc.country}`,
        value: doc.state,
        meta: { country: doc.country }
      });
    }

    suggestions.push({
      type: 'property',
      label: doc.title,
      value: doc.id,
      meta: { city: doc.city, type: doc.type, price: doc.base_price_per_night }
    });
  }

  return suggestions.slice(0, limit * 2);
};
