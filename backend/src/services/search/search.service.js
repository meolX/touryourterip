import prisma from '../../db/prisma.js';
import ApiError from '../../utils/ApiError.js';

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

// ─── Build dynamic Prisma WHERE clause ─────────────────
const buildPropertyFilter = (filters) => {
  const where = { status: 'active' };

  // Location filters
  if (filters.city) {
    where.city = { contains: filters.city, mode: 'insensitive' };
  }
  if (filters.state) {
    where.state = { contains: filters.state, mode: 'insensitive' };
  }
  if (filters.country) {
    where.country = { contains: filters.country, mode: 'insensitive' };
  }

  // Property type
  if (filters.type) {
    where.type = filters.type;
  }

  // Price range (base_price_per_night on Property)
  if (filters.min_price !== undefined || filters.max_price !== undefined) {
    where.base_price_per_night = {};
    if (filters.min_price !== undefined) {
      where.base_price_per_night.gte = filters.min_price;
    }
    if (filters.max_price !== undefined) {
      where.base_price_per_night.lte = filters.max_price;
    }
  }

  // Minimum rating
  if (filters.min_rating !== undefined) {
    where.rating_avg = { gte: filters.min_rating };
  }

  // Room-level filters (guests, amenities)
  const roomFilter = {};
  let hasRoomFilter = false;

  if (filters.guests !== undefined) {
    roomFilter.max_guests = { gte: filters.guests };
    hasRoomFilter = true;
  }
  if (filters.has_ac !== undefined) {
    roomFilter.has_ac = filters.has_ac;
    hasRoomFilter = true;
  }
  if (filters.has_wifi !== undefined) {
    roomFilter.has_wifi = filters.has_wifi;
    hasRoomFilter = true;
  }

  // Only include active rooms
  if (hasRoomFilter) {
    roomFilter.is_active = true;
    where.rooms = { some: roomFilter };
  }

  return where;
};

// ─── Build ORDER BY clause ─────────────────────────────
const buildOrderBy = (sortBy, sortOrder) => {
  const direction = sortOrder || 'desc';

  switch (sortBy) {
    case 'price':
      return { base_price_per_night: direction };
    case 'rating':
      return { rating_avg: direction };
    case 'reviews':
      return { review_count: direction };
    case 'newest':
    default:
      return { created_at: direction };
  }
};

// ─── SEARCH PROPERTIES ─────────────────────────────────
export const searchProperties = async (filters) => {
  const where = buildPropertyFilter(filters);
  const orderBy = buildOrderBy(filters.sort_by, filters.sort_order);

  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  const isGeoSearch =
    filters.latitude !== undefined && filters.longitude !== undefined;

  // ── Date-availability check: find rooms that have
  //    conflicting bookings during the requested range ──
  let unavailablePropertyIds = [];

  if (filters.check_in && filters.check_out) {
    const checkIn = new Date(filters.check_in);
    const checkOut = new Date(filters.check_out);

    // Find rooms where ALL units are fully booked or blocked
    const blockedRooms = await prisma.$queryRawUnsafe(
      `
      SELECT DISTINCT r.property_id
      FROM rooms r
      WHERE r.is_active = true
        AND NOT EXISTS (
          -- A room is available if at least one unit is free for every night
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

    unavailablePropertyIds = blockedRooms.map((r) => r.property_id);

    if (unavailablePropertyIds.length > 0) {
      where.id = { notIn: unavailablePropertyIds };
    }
  }

  // Fetch matching properties
  const [properties, totalCount] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy,
      skip,
      take: limit,
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
          take: 1,
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
            has_wifi: true,
          },
          orderBy: { price_per_night: 'asc' },
          take: 3, // Preview cheapest 3 rooms
        },
      },
    }),
    prisma.property.count({ where }),
  ]);

  // Post-process: add geo distance if lat/lng provided
  let results = properties.map((p) => {
    const property = {
      ...p,
      cover_photo: p.photos[0] || null,
      starting_price: p.rooms[0]?.price_per_night ?? p.base_price_per_night,
    };
    delete property.photos;

    if (isGeoSearch && p.latitude && p.longitude) {
      property.distance_km = Math.round(
        haversineDistance(filters.latitude, filters.longitude, p.latitude, p.longitude) * 100
      ) / 100;
    }

    return property;
  });

  // Filter by radius if geo search
  if (isGeoSearch) {
    const radius = filters.radius || 10;
    results = results.filter(
      (p) => p.distance_km !== undefined && p.distance_km <= radius
    );
    // Sort by distance (nearest first) for geo searches
    results.sort((a, b) => a.distance_km - b.distance_km);
  }

  const totalPages = Math.ceil(totalCount / limit);

  return {
    properties: results,
    pagination: {
      page,
      limit,
      total: isGeoSearch ? results.length : totalCount,
      total_pages: isGeoSearch ? Math.ceil(results.length / limit) : totalPages,
      has_next: isGeoSearch ? false : page < totalPages,
      has_prev: page > 1,
    },
  };
};

// ─── SUGGESTIONS (Auto-complete) ────────────────────────
export const getSuggestions = async (query, limit = 5) => {
  const q = query.trim();

  if (q.length < 2) {
    throw new ApiError(400, 'Query must be at least 2 characters');
  }

  // Search by city, state, and property title in parallel
  const [cities, states, properties] = await Promise.all([
    // Distinct cities
    prisma.property.findMany({
      where: {
        status: 'active',
        city: { contains: q, mode: 'insensitive' },
      },
      select: { city: true, state: true, country: true },
      distinct: ['city'],
      take: limit,
    }),

    // Distinct states
    prisma.property.findMany({
      where: {
        status: 'active',
        state: { contains: q, mode: 'insensitive' },
      },
      select: { state: true, country: true },
      distinct: ['state'],
      take: limit,
    }),

    // Property titles
    prisma.property.findMany({
      where: {
        status: 'active',
        title: { contains: q, mode: 'insensitive' },
      },
      select: {
        id: true,
        title: true,
        city: true,
        type: true,
        base_price_per_night: true,
      },
      take: limit,
    }),
  ]);

  // De-duplicate and format
  const suggestions = [
    ...cities.map((c) => ({
      type: 'city',
      label: `${c.city}, ${c.state}`,
      value: c.city,
      meta: { state: c.state, country: c.country },
    })),
    ...states.map((s) => ({
      type: 'state',
      label: `${s.state}, ${s.country}`,
      value: s.state,
      meta: { country: s.country },
    })),
    ...properties.map((p) => ({
      type: 'property',
      label: p.title,
      value: p.id,
      meta: { city: p.city, type: p.type, price: p.base_price_per_night },
    })),
  ];

  // Limit total results
  return suggestions.slice(0, limit * 2);
};

// ─── NEARBY PROPERTIES ─────────────────────────────────
export const getNearbyProperties = async (latitude, longitude, radius = 10, limit = 10) => {
  // Fetch all active properties with coordinates
  const properties = await prisma.property.findMany({
    where: {
      status: 'active',
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      title: true,
      type: true,
      city: true,
      state: true,
      latitude: true,
      longitude: true,
      base_price_per_night: true,
      currency: true,
      rating_avg: true,
      review_count: true,
      photos: {
        where: { is_cover: true },
        select: { url: true, caption: true },
        take: 1,
      },
    },
  });

  // Calculate distance and filter by radius
  const nearby = properties
    .map((p) => ({
      ...p,
      cover_photo: p.photos[0] || null,
      distance_km:
        Math.round(haversineDistance(latitude, longitude, p.latitude, p.longitude) * 100) / 100,
    }))
    .filter((p) => p.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);

  // Clean up photos array from response
  return nearby.map(({ photos, ...rest }) => rest);
};
