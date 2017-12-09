const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClassSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  // identifier: { 
  //   type: String,
  //   required: true
  // },
  description: {
    type: String,
    required: true
  },
  events: [{
    date: Date,
    name: String,
    description: String
  }],
  professor: {
    type: String
  }
  // professor: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'Professor'
  // },
  // students: [{
  //   type: Schema.Types.ObjectId,
  //   ref: 'Student'
  // }],
  // submissions: [{
  //   type: Schema.Types.ObjectId,
  //   ref: 'Submission'
  // }]
});

const Class = module.exports = mongoose.model('Class', ClassSchema);

module.exports.addClass = (newClass, callback) => {
  console.log(newClass);
  newClass.save(callback);
}