const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: String,
  username: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const tweetSchema = new mongoose.Schema({
  tweetId: { type: String, unique: true },
  guildId: String,
  authorId: String,
  authorUsername: String,
  authorAvatar: String,
  content: String,
  likes: { type: [String], default: [] },
  reposts: { type: [String], default: [] },
  comments: { type: [commentSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Tweet', tweetSchema);
