const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema(
  {
    user_A: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user_B: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

friendSchema.index({ user_A: 1, user_B: 1 }, { unique: true });

module.exports = mongoose.model('Friend', friendSchema);
