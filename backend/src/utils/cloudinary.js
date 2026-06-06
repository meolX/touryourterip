import { v2 as cloudinary } from 'cloudinary';
import config from '../config/index.js';

// ─── Configure Cloudinary ──────────────────────────────
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder path
 * @param {string} [options.publicId] - Custom public ID
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'tyt/properties',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
      ...(options.publicId && { public_id: options.publicId }),
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete a file from Cloudinary by its public ID.
 *
 * @param {string} publicId - The Cloudinary public ID
 * @returns {Promise<Object>} Cloudinary deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

/**
 * Extract the public_id from a Cloudinary URL.
 * e.g. https://res.cloudinary.com/demo/image/upload/v123/tyt/properties/abc.jpg
 *      → tyt/properties/abc
 */
export const extractPublicId = (url) => {
  if (!url) return null;
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;

  // Remove the version prefix (v1234567890/) and file extension
  const pathAfterUpload = parts[1];
  const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
  const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, '');

  return withoutExtension;
};

export default cloudinary;
