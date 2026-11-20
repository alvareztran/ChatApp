const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const avatarDir = path.join(__dirname, '..', 'uploads', 'avatars');

const saveAvatar = async (buffer, userId) => {
  const filename = `${userId}-${crypto.randomUUID()}.webp`;
  await fs.mkdir(avatarDir, { recursive: true });
  await sharp(buffer)
    .rotate()
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 85 })
    .toFile(path.join(avatarDir, filename));
  return { filename, url: `/uploads/avatars/${filename}` };
};

const removeAvatar = async (filename) => {
  if (!filename || path.basename(filename) !== filename) return;
  await fs.rm(path.join(avatarDir, filename), { force: true });
};

module.exports = { avatarDir, saveAvatar, removeAvatar };
