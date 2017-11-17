const moment = require('moment');

module.exports.getToday = () => {
  return moment().toDate();
}