const multer = require('multer');

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.');
      error.status = 400;
      return cb(error);
    }
    return cb(null, true);
  },
}).single('avatar');

module.exports = (req, res, next) => {
  parser(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      error.status = 400;
      error.message = 'Ảnh đại diện không được vượt quá 2 MB.';
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      error.status = 400;
      error.message = "Trường tệp không hợp lệ; vui lòng dùng trường 'avatar'.";
    } else if (!error.status) {
      error.status = 400;
    }
    return next(error);
  });
};
