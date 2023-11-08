const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  content: String,
  date: Date
});

const friendsSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  first: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  second: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  chat: [chatSchema]
});

module.exports = mongoose.model('Friends', friendsSchema);