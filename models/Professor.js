const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bcryptHelper = require('../helper/bcrypt-helper');

const ProfessorSchema = new Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
    required: true,
    set: toLower
  },
  password: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdOn: {
    type: Date,
    default: Date.now()
  },
  lastVisited: Date
});

function toLower(str) {
  return str.toLowerCase();
}

const Professor = module.exports = mongoose.model('Professor', ProfessorSchema);

//Exported Functions
module.exports.generatePassword = () => {
  const possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let genPass = '';

  for (let i = 0; i < 8; i++) {
    genPass += possibleChars.charAt(Math.random() * possibleChars.length);
  }

  return genPass;
}

module.exports.getProfByEmail = (email, callback) => {
  Professor.findOne({
      email: email
    }, '-__v')
    .exec(callback);
}

module.exports.comparePasswords = (candidatePassword, hashPassword, callback) => {
  bcryptHelper.comparePasswords(candidatePassword, hash, callback);
}

module.exports.changePassword = (id, newPassword, callback) => {
  newPassword = bcryptHelper.hashSalt(newPassword);
  Professor.findByIdAndUpdate(id, {$set: {password: newPassword}}, {new: true})
  .exec(callback);
}