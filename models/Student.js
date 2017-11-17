const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bcryptHelper = require('../helper/bcrypt-helper');

const StudentSchema = new Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    required: true,
    unique: true,
    set: toLower
  },
  password: {
    type: String,
    required: true
  },
  createdOn: {
    type: Date,
    default: Date.now()
  },
  lastVisited: Date,
  classes: [{
    type: Schema.Types.ObjectId,
    ref: 'Class'
  }],
  submissions: [{
    type: Schema.Types.ObjectId,
    ref: 'Submission'
  }]
});

function toLower(str) {
  return str.toLowerCase();
}

const Student = module.exports = mongoose.model('Student', StudentSchema);

//Exported Functions
module.exports.getStudentByEmail = (email, callback) => {
  Student.findOne({
      email: email
    }, '-__v')
    .exec(callback);
}

module.exports.getStudentById = (id, callback) => {
  Student.findById(id, '-__v')
    .exec(callback);
}

module.exports.comparePasswords = (candidatePassword, hashPassword, callback) => {
  bcryptHelper.comparePasswords(candidatePassword, hashPassword, callback);
}

module.exports.registerStudent = (newStudent, callback) => {
  newStudent.password = bcryptHelper.hashSalt(newStudent.password);
  newStudent.save(callback);
}

module.exports.changePassword = (id, newPassword, callback) => {
  newPassword = bcryptHelper.hashSalt(newPassword);
  Student.findByIdAndUpdate(id, {$set: {password: newPassword}}, {new: true})
    .exec(callback);
}