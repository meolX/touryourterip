import multer from 'multer';
import ApiError from '../utils/ApiError.js';
import config from '../config/index.js';

// ─── Allowed MIME types ────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

// ─── File filter ───────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, AVIF`), false);
  }
};

// ─── Multer instance (memory storage for Cloudinary) ───
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE, // 5 MB default
    files: 10, // Max 10 files per request
  },
});

export default upload;
