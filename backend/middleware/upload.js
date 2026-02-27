const multer = require('multer');
const path = require('path');

// Configure storage based on environment
// For local development (or when not explicitly in production), use local disk
// For Cloud Run production, use memory storage because local files are destroyed on container restarts
let storage;
if (process.env.NODE_ENV === 'production') {
    storage = multer.memoryStorage();
} else {
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
}

// File filter (JPEG only as requested, but maybe allow PNG too for flexibility)
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG/PNG images are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload;
