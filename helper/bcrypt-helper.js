const bcrypt = require('bcryptjs');

module.exports.hashSalt = (password) => {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) console.error(`Error generating salt: ${err}`);
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) console.error(`Error hashing password: ${err}`);
      return hash;
    });
  });
}

module.exports.comparePasswords = (candidatePassword, hash, callback) => {
  bcrypt.compare(candidatePassword, hash, (err, isMatched) => {
    if (err) {
      return console.error(`Error comparing password: ${err}`);
    }

    return callback(null, isMatched);
  });
}