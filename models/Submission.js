const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubmissionSchema = new Schema({
  createdOn: {
    type: Date,
    defaut: Date.now()
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'Student'
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event'
  },
  image: {
    type: String
  },
  description: {
    type: String
  },
  approval: {
    approved: {
      type: Boolean,
      default: false
    },
    approvedDate: {
      type: Date
    }
  }
});

const Submission = module.exports = mongoose.model('Submission', SubmissionSchema);