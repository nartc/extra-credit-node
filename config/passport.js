const JwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;
const config = require('./keys');

const Professor = require('../models/Professor');

module.exports = (passport) => {
  let options = {};

  options.jwtFromRequest = extractJwt.fromAuthHeaderWithScheme('jwt');
  options.secretOrKey = config.secretKEY;

  passport.use(new JwtStrategy(options, (jwt_payload, done) => {
    console.log('JWT Payload: ', jwt_payload);
  }));
}