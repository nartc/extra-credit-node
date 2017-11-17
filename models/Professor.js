const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

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
  bcrypt.compare(candidatePassword, hashPassword, (err, isMatched) => {
    if (err) {
      return console.error(`Error comparing password ${err}`);
    }

    callback(null, isMatched);
  });
}

module.exports.changePassword = (id, newPassword, callback) => {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) console.error(`Error generating salt ${err}`);
    bcrypt.hash(newPassword, salt, (err, hash) => {
      if (err) console.error(`Error hashing new password ${err}`);
      newPassword = hash;

      Professor.findByIdAndUpdate(id, {$set: {password: newPassword}}, {new: true})
        .exec(callback);
    });
  });
}