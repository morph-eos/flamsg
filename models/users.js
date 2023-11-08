const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  pendingFList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Function to check the password (for Hashing)
userSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.log("Errore ", error);
  }
};

module.exports = mongoose.model('User', userSchema);