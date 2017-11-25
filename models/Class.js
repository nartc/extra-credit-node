const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClassSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  identifier: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  professor: {
    type: Schema.Types.ObjectId,
    ref: 'Professor'
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'Student'
  }],
  submissions: [{
    type: Schema.Types.ObjectId,
    ref: 'Submission'
  }]
});

const Class = module.exports = mongoose.model('Class', ClassSchema);
