'use strict';

const multer = require('multer');
const path = require('path');
const config = require('../config');

/**
 * Use memory storage — we never write uploads to disk.
 * The CSV buffer is processed in-memory and discarded.
 */
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  const isValidExt = config.upload.allowedExtensions.includes(ext);
  const isValidMime = config.upload.allowedMimeTypes.includes(mime);

  if (isValidExt || isValidMime) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only CSV files are accepted. Got: ${mime} / ${ext}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSizeBytes },
  fileFilter,
});

module.exports = upload;
