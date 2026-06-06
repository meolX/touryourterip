import prisma from '../../db/prisma.js';
import ApiError from '../../utils/ApiError.js';

/**
 * Check if the user is the owner (host) of the property or is an admin.
 */
const verifyPropertyOwnership = async (propertyId, userId, userRole) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new ApiError(404, 'Property not found');
  }

  if (userRole !== 'admin' && property.host_id !== userId) {
    throw new ApiError(403, 'Access denied. You do not own this property.');
  }

  return property;
};

// ─── CREATE PROPERTY ───────────────────────────────────
export const createProperty = async (hostId, data) => {
  const existingProperty = await prisma.property.findUnique({
    where: { title: data.title },
  });

  if (existingProperty) {
    throw new ApiError(409, 'A property with this title already exists');
  }

  const property = await prisma.property.create({
    data: {
      ...data,
      host_id: hostId,
      amenities: data.amenities ? JSON.stringify(data.amenities) : null,
    },
  });

  return property;
};

// ─── GET PROPERTIES ────────────────────────────────────
export const getProperties = async (filters = {}) => {
  const { city, type, min_price, max_price, status = 'active' } = filters;

  const where = {
    status,
    ...(city && { city: { contains: city, mode: 'insensitive' } }),
    ...(type && { type }),
    ...((min_price || max_price) && {
      base_price_per_night: {
        ...(min_price && { gte: parseFloat(min_price) }),
        ...(max_price && { lte: parseFloat(max_price) }),
      },
    }),
  };

  const properties = await prisma.property.findMany({
    where,
    include: {
      photos: {
        where: { is_cover: true },
        take: 1,
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return properties.map((p) => ({
    ...p,
    amenities: p.amenities ? JSON.parse(p.amenities) : [],
  }));
};

// ─── GET PROPERTY BY ID ────────────────────────────────
export const getPropertyById = async (id) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      rooms: {
        where: { is_active: true },
      },
      photos: true,
      reviews: {
        where: { is_published: true },
        select: {
          id: true,
          overall_rating: true,
          comment: true,
          created_at: true,
          guest: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!property) {
    throw new ApiError(404, 'Property not found');
  }

  return {
    ...property,
    amenities: property.amenities ? JSON.parse(property.amenities) : [],
  };
};

// ─── UPDATE PROPERTY ───────────────────────────────────
export const updateProperty = async (propertyId, userId, userRole, data) => {
  const property = await verifyPropertyOwnership(propertyId, userId, userRole);

  if (data.title && data.title !== property.title) {
    const existing = await prisma.property.findUnique({ where: { title: data.title } });
    if (existing) {
      throw new ApiError(409, 'A property with this title already exists');
    }
  }

  const updatedProperty = await prisma.property.update({
    where: { id: propertyId },
    data: {
      ...data,
      amenities: data.amenities ? JSON.stringify(data.amenities) : undefined,
    },
  });

  return {
    ...updatedProperty,
    amenities: updatedProperty.amenities ? JSON.parse(updatedProperty.amenities) : [],
  };
};

// ─── DELETE PROPERTY (SOFT) ────────────────────────────
export const deleteProperty = async (propertyId, userId, userRole) => {
  await verifyPropertyOwnership(propertyId, userId, userRole);

  // Soft-delete property and mark rooms inactive
  await prisma.$transaction([
    prisma.property.update({
      where: { id: propertyId },
      data: { status: 'inactive' },
    }),
    prisma.room.updateMany({
      where: { property_id: propertyId },
      data: { is_active: false },
    }),
  ]);

  return { message: 'Property deleted (deactivated) successfully' };
};

// ─── ADD ROOM ──────────────────────────────────────────
export const addRoom = async (propertyId, userId, userRole, data) => {
  await verifyPropertyOwnership(propertyId, userId, userRole);

  const room = await prisma.room.create({
    data: {
      ...data,
      property_id: propertyId,
    },
  });

  return room;
};

// ─── GET ROOMS ─────────────────────────────────────────
export const getRooms = async (propertyId) => {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    throw new ApiError(404, 'Property not found');
  }

  const rooms = await prisma.room.findMany({
    where: { property_id: propertyId, is_active: true },
  });

  return rooms;
};

// ─── UPDATE ROOM ───────────────────────────────────────
export const updateRoom = async (propertyId, roomId, userId, userRole, data) => {
  await verifyPropertyOwnership(propertyId, userId, userRole);

  const room = await prisma.room.findFirst({
    where: { id: roomId, property_id: propertyId },
  });

  if (!room) {
    throw new ApiError(404, 'Room not found in this property');
  }

  const updatedRoom = await prisma.room.update({
    where: { id: roomId },
    data,
  });

  return updatedRoom;
};

// ─── DELETE ROOM (SOFT) ────────────────────────────────
export const deleteRoom = async (propertyId, roomId, userId, userRole) => {
  await verifyPropertyOwnership(propertyId, userId, userRole);

  const room = await prisma.room.findFirst({
    where: { id: roomId, property_id: propertyId },
  });

  if (!room) {
    throw new ApiError(404, 'Room not found in this property');
  }

  await prisma.room.update({
    where: { id: roomId },
    data: { is_active: false },
  });

  return { message: 'Room deactivated successfully' };
};

// ─── ADD PHOTO ─────────────────────────────────────────
export const addPhoto = async (propertyId, userId, userRole, data) => {
  await verifyPropertyOwnership(propertyId, userId, userRole);

  // If room is specified, verify it belongs to this property
  if (data.room_id) {
    const roomExists = await prisma.room.findFirst({
      where: { id: data.room_id, property_id: propertyId },
    });
    if (!roomExists) {
      throw new ApiError(400, 'Room does not belong to this property');
    }
  }

  // If setting as cover photo, unset previous cover photo
  if (data.is_cover) {
    await prisma.propertyPhoto.updateMany({
      where: { property_id: propertyId, is_cover: true },
      data: { is_cover: false },
    });
  }

  const photo = await prisma.propertyPhoto.create({
    data: {
      ...data,
      property_id: propertyId,
    },
  });

  return photo;
};

// ─── DELETE PHOTO ──────────────────────────────────────
export const deletePhoto = async (propertyId, photoId, userId, userRole) => {
  await verifyPropertyOwnership(propertyId, userId, userRole);

  const photo = await prisma.propertyPhoto.findFirst({
    where: { id: photoId, property_id: propertyId },
  });

  if (!photo) {
    throw new ApiError(404, 'Photo not found in this property');
  }

  await prisma.propertyPhoto.delete({
    where: { id: photoId },
  });

  return { message: 'Photo deleted successfully' };
};

// ─── SET COVER PHOTO ───────────────────────────────────
export const setCoverPhoto = async (propertyId, photoId, userId, userRole) => {
  await verifyPropertyOwnership(propertyId, userId, userRole);

  const photo = await prisma.propertyPhoto.findFirst({
    where: { id: photoId, property_id: propertyId },
  });

  if (!photo) {
    throw new ApiError(404, 'Photo not found in this property');
  }

  await prisma.$transaction([
    prisma.propertyPhoto.updateMany({
      where: { property_id: propertyId, is_cover: true },
      data: { is_cover: false },
    }),
    prisma.propertyPhoto.update({
      where: { id: photoId },
      data: { is_cover: true },
    }),
  ]);

  return { message: 'Cover photo updated successfully' };
};
