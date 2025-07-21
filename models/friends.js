const mongoose = require('mongoose');

/**
 * Chat Message Schema - Individual chat messages within a friendship
 */
const chatSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference to the user who sent the message
  },
  content: String, // The actual message text
  date: Date // Timestamp when message was sent
});

/**
 * Friends Schema - Represents a friendship between two users
 * Contains chat history between the friends
 */
const friendsSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  first: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // First user in the friendship
  },
  second: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Second user in the friendship
  },
  chat: [chatSchema] // Array of chat messages between the friends
});

module.exports = mongoose.model('Friends', friendsSchema);