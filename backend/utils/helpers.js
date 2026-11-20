const mongoose = require('mongoose');

/** Wraps an async route handler to forward errors to Express error middleware. */
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/** Creates an HTTP error with a status code. */
const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/** Returns true if `id` is a valid MongoDB ObjectId. */
const isValidObjectId = (id) => mongoose.isValidObjectId(id);

/**
 * Returns a safe representation of a user.
 * Email and phone are only included for the user themselves (`self: true`).
 */
const publicUser = (user, { self = false } = {}) => {
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  if (!self) {
    delete obj.email;
    delete obj.phone;
  }
  return obj;
};

module.exports = { asyncHandler, httpError, isValidObjectId, publicUser };
