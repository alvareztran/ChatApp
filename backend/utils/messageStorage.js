const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const messageImageDir = path.join(__dirname, '..', 'uploads', 'messages');

const saveMessageImage = async (buffer, userId) => {
  const filename = `${userId}-${crypto.randomUUID()}.webp`;
  await fs.mkdir(messageImageDir, { recursive: true });
  await sharp(buffer)
    .rotate()
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(messageImageDir, filename));
  return { filename, url: `/uploads/messages/${filename}` };
};

const removeMessageImage = async (filename) => {
  if (!filename || path.basename(filename) !== filename) return;
  await fs.rm(path.join(messageImageDir, filename), { force: true });
};

module.exports = { messageImageDir, saveMessageImage, removeMessageImage };
