const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    // Prefix with timestamp + userId to avoid collisions
    const unique = `${Date.now()}-${req.user.id}${path.extname(file.originalname)}`;
    cb(null, unique);
  }
});

const ALLOWED_TYPES = /pdf|txt|docx|png|jpg|jpeg|gif/;

function fileFilter(req, file, cb) {
  const ext  = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype;
  if (ALLOWED_TYPES.test(ext)) return cb(null, true);
  cb(new Error('File type not allowed. Use PDF, TXT, DOCX, or images.'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

module.exports = upload;
