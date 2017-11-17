const bcrypt = require('bcryptjs');

module.exports.hashSalt = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

module.exports.comparePasswords = (candidatePassword, hash, callback) => {
  bcrypt.compare(candidatePassword, hash, (err, isMatched) => {
    if (err) {
      return console.error(`Error comparing password: ${err}`);
    }

    return callback(null, isMatched);
  });
}