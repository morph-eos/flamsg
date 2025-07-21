const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema - Defines the structure for user documents in MongoDB
 * Includes authentication and friend system functionality
 */
const userSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  username: {
    type: String,
    required: true,
    unique: true // Ensures no duplicate usernames
  },
  password: {
    type: String,
    required: true // Stored as bcrypt hash, never plain text
  },
  pendingFList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Array of user IDs who sent friend requests
  }]
});

// Method to compare provided password with stored hash
userSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.log("Password comparison error:", error);
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);