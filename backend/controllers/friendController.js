const Friend = require("../models/friendSchema");
const { httpError, isValidObjectId, publicUser } = require("../utils/helpers");

const FRIEND_POPULATE = "username displayName avatarUrl avatarId bio";

const getFriends = async (req, res) => {
  const relations = await Friend.find({
    $or: [{ user_A: req.userId }, { user_B: req.userId }],
  }).populate("user_A user_B", FRIEND_POPULATE);

  const friends = relations.map((relation) => {
    const friend =
      relation.user_A._id.toString() === req.userId
        ? relation.user_B
        : relation.user_A;
    return { friendshipId: relation._id, user: publicUser(friend) };
  });
  return res.json(friends);
};

const deleteFriend = async (req, res) => {
  if (!isValidObjectId(req.params.friend_id))
    throw httpError(400, "Invalid friend ID");
  const relation = await Friend.findById(req.params.friend_id);
  if (!relation) throw httpError(404, "Friendship not found");
  if (
    relation.user_A.toString() !== req.userId &&
    relation.user_B.toString() !== req.userId
  ) {
    throw httpError(403, "You cannot delete this friendship");
  }
  await relation.deleteOne();
  return res.json({ message: "Friend removed successfully" });
};

module.exports = { getFriends, deleteFriend };
