const JwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;
const config = require('./keys');

const Professor = require('../models/Professor');
const Student = require('../models/Student');

module.exports = (passport) => {
  let options = {};

  options.jwtFromRequest = extractJwt.fromAuthHeaderWithScheme('jwt');
  options.secretOrKey = config.secretKEY;

  passport.use(new JwtStrategy(options, (jwt_payload, done) => {
    if (jwt_payload.student) {
      Student.getStudentById(jwt_payload.student._id, (err, student) => {
        if (err) {
          return done(err, false);
        }

        if (student) {
          return done(null, student, {issuedAt: jwt_payload.iat});
        } else {
          return done(null, false);
        }
      });
    } else if (jwt_payload.professor) {
      Professor.getProfById(jwt_payload.professor._id, (err, professor) => {
        if (err) {
          return done(err, false);
        }

        if (professor) {
          return done(null, professor, {issuedAt: jwt_payload.iat});
        } else {
          return done(null, false);
        }
      });
    }
  }));
}