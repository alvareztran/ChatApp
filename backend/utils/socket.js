const userRoom = (userId) => `user:${userId}`;

/** Emits an event to every socket of each given user (deduplicated). */
const emitToUsers = (io, userIds, event, payload) => {
  new Set(userIds.map(String)).forEach((userId) =>
    io.to(userRoom(userId)).emit(event, payload),
  );
};

module.exports = { userRoom, emitToUsers };
