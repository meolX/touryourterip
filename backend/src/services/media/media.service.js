import prisma from '../../db/prisma.js';
import ApiError from '../../utils/ApiError.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} from '../../utils/cloudinary.js';

// ─── VERIFY PROPERTY OWNERSHIP ─────────────────────────
const verifyPropertyOwnership = async (propertyId, hostId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, host_id: true, title: true },
  });

  if (!property) {
    throw new ApiError(404, 'Property not found');
  }

  if (property.host_id !== hostId) {
    throw new ApiError(403, 'You can only manage photos for your own properties');
  }

  return property;
};

// ─── UPLOAD PHOTOS ─────────────────────────────────────
export const uploadPhotos = async (hostId, data, files) => {
  const { property_id, room_id, caption, is_cover } = data;

  if (!files || files.length === 0) {
    throw new ApiError(400, 'At least one image file is required');
  }

  // 1. Verify ownership
  await verifyPropertyOwnership(property_id, hostId);

  // 2. If room_id provided, verify it belongs to this property
  if (room_id) {
    const room = await prisma.room.findFirst({
      where: { id: room_id, property_id },
    });
    if (!room) {
      throw new ApiError(404, 'Room not found or does not belong to this property');
    }
  }

  // 3. If setting as cover, unset any existing cover for this property
  if (is_cover) {
    await prisma.propertyPhoto.updateMany({
      where: { property_id, is_cover: true },
      data: { is_cover: false },
    });
  }

  // 4. Upload each file to Cloudinary and create DB records
  const folder = room_id
    ? `tyt/properties/${property_id}/rooms/${room_id}`
    : `tyt/properties/${property_id}`;

  const uploadResults = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const cloudinaryResult = await uploadToCloudinary(file.buffer, { folder });

    const photo = await prisma.propertyPhoto.create({
      data: {
        property_id,
        room_id: room_id || null,
        url: cloudinaryResult.secure_url,
        caption: caption || null,
        is_cover: is_cover && i === 0, // Only first photo gets cover if requested
      },
    });

    uploadResults.push({
      id: photo.id,
      url: photo.url,
      caption: photo.caption,
      is_cover: photo.is_cover,
    });
  }

  return uploadResults;
};

// ─── GET PHOTOS FOR A PROPERTY ─────────────────────────
export const getPropertyPhotos = async (propertyId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true },
  });

  if (!property) {
    throw new ApiError(404, 'Property not found');
  }

  const photos = await prisma.propertyPhoto.findMany({
    where: { property_id: propertyId },
    orderBy: [{ is_cover: 'desc' }, { room_id: 'asc' }],
    select: {
      id: true,
      url: true,
      caption: true,
      is_cover: true,
      room_id: true,
      room: {
        select: { name: true, room_type: true },
      },
    },
  });

  // Group by: property-level vs room-level
  const propertyPhotos = photos.filter((p) => !p.room_id);
  const roomPhotos = photos.filter((p) => p.room_id);

  // Group room photos by room_id
  const roomGroups = {};
  for (const photo of roomPhotos) {
    const key = photo.room_id;
    if (!roomGroups[key]) {
      roomGroups[key] = {
        room_id: key,
        room_name: photo.room?.name,
        room_type: photo.room?.room_type,
        photos: [],
      };
    }
    const { room, room_id, ...rest } = photo;
    roomGroups[key].photos.push(rest);
  }

  return {
    total: photos.length,
    property_photos: propertyPhotos.map(({ room, room_id, ...rest }) => rest),
    room_photos: Object.values(roomGroups),
  };
};

// ─── UPDATE PHOTO ──────────────────────────────────────
export const updatePhoto = async (photoId, hostId, data) => {
  const photo = await prisma.propertyPhoto.findUnique({
    where: { id: photoId },
    include: { property: { select: { host_id: true } } },
  });

  if (!photo) {
    throw new ApiError(404, 'Photo not found');
  }

  if (photo.property.host_id !== hostId) {
    throw new ApiError(403, 'You can only update photos for your own properties');
  }

  // If setting as cover, unset existing cover for this property
  if (data.is_cover === true) {
    await prisma.propertyPhoto.updateMany({
      where: { property_id: photo.property_id, is_cover: true },
      data: { is_cover: false },
    });
  }

  const updatedPhoto = await prisma.propertyPhoto.update({
    where: { id: photoId },
    data,
    select: {
      id: true,
      url: true,
      caption: true,
      is_cover: true,
      room_id: true,
    },
  });

  return updatedPhoto;
};

// ─── SET COVER PHOTO ───────────────────────────────────
export const setCoverPhoto = async (photoId, hostId) => {
  const photo = await prisma.propertyPhoto.findUnique({
    where: { id: photoId },
    include: { property: { select: { host_id: true } } },
  });

  if (!photo) {
    throw new ApiError(404, 'Photo not found');
  }

  if (photo.property.host_id !== hostId) {
    throw new ApiError(403, 'You can only manage photos for your own properties');
  }

  // Transaction: unset old cover, set new cover
  return await prisma.$transaction(async (tx) => {
    await tx.propertyPhoto.updateMany({
      where: { property_id: photo.property_id, is_cover: true },
      data: { is_cover: false },
    });

    const updatedPhoto = await tx.propertyPhoto.update({
      where: { id: photoId },
      data: { is_cover: true },
      select: {
        id: true,
        url: true,
        caption: true,
        is_cover: true,
      },
    });

    return updatedPhoto;
  });
};

// ─── DELETE PHOTO ──────────────────────────────────────
export const deletePhoto = async (photoId, userId, role) => {
  const photo = await prisma.propertyPhoto.findUnique({
    where: { id: photoId },
    include: { property: { select: { host_id: true } } },
  });

  if (!photo) {
    throw new ApiError(404, 'Photo not found');
  }

  // Only owner or admin can delete
  if (role !== 'admin' && photo.property.host_id !== userId) {
    throw new ApiError(403, 'You can only delete photos for your own properties');
  }

  // 1. Delete from Cloudinary
  const publicId = extractPublicId(photo.url);
  if (publicId) {
    try {
      await deleteFromCloudinary(publicId);
    } catch (err) {
      console.error(`[MEDIA] Failed to delete from Cloudinary: ${publicId}`, err.message);
      // Don't throw — still delete DB record even if Cloudinary fails
    }
  }

  // 2. Delete from database
  await prisma.propertyPhoto.delete({
    where: { id: photoId },
  });

  return { deleted: true, id: photoId };
};

// ─── BULK DELETE (all photos for a property) ────────────
export const deleteAllPropertyPhotos = async (propertyId, hostId) => {
  await verifyPropertyOwnership(propertyId, hostId);

  const photos = await prisma.propertyPhoto.findMany({
    where: { property_id: propertyId },
    select: { id: true, url: true },
  });

  // Delete from Cloudinary in parallel
  const deletePromises = photos.map(async (photo) => {
    const publicId = extractPublicId(photo.url);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (err) {
        console.error(`[MEDIA] Failed to delete from Cloudinary: ${publicId}`, err.message);
      }
    }
  });

  await Promise.allSettled(deletePromises);

  // Delete all DB records
  const result = await prisma.propertyPhoto.deleteMany({
    where: { property_id: propertyId },
  });

  return { deleted: result.count, property_id: propertyId };
};
