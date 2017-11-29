const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');

const config = require("../config/keys");
const emailHelper = require("../helper/email-helper");
const momentHelper = require('../helper/moment-helper');
const bcryptHelper = require('../helper/bcrypt-helper');
const Professor = require("../models/Professor");
const ProfessorCatalog = require("../app");

//JWT Options
const jwtOptions = {
  expiresIn: 18000
};

//Init Professor Account
router.post('/init', (req, res) => {
  console.log(req.body);
  const emailInput = req.body.email;
  const emailQuery = {
    email: emailInput
  };

  //Check if there's already a professor with this email in the db
  Professor.getProfByEmail(emailInput, (err, professor) => {
    if (err) {
      resolveErrorResponse(res, 'Error Initializing Professor Account', 500, err);
    }

    //If there's a professor
    if (professor) {
      //Check to see if this professor's verified
      if (!professor.verified) {
        //Change this professor's temp password if they're not verified
        const tempPassword = Professor.generatePassword();
        professor.password = bcryptHelper.hashSalt(tempPassword);
        //Save this professor in db
        professor.save((err, savedProfessor) => {
          if (err) {
            resolveErrorResponse(res, 'Error Initializing Professor Account', 500, err);
          }

          //If savedProfessor, init payload for JWT
          const payload = {
            professor: savedProfessor
          };

          //Generate JWT Token
          jwt.sign(payload, config.secretKEY, jwtOptions, (err, token) => {
            if (err) {
              resolveErrorResponse(res, 'Error Initializing Professor Account', 500, err);
            }

            //Assign JWT Token to a Variable
            const initToken = token;
            emailHelper.sendMail(initToken, savedProfessor, tempPassword, (err, info) => {
              if (err) console.error('ERROR sending email: ', err);
            });
          });

          //Response to Frontend
          res.status(200).json({
            success: true,
            title: 'success',
            message: 'Successfully Initialized Professor Account.',
            professor: savedProfessor
          });
        });
      } else {
        //If the professor's already verified
        resolveErrorResponse(res, 'You are already verified', 400);
      }
    } else { //If there's not a professor with the email input
      //Check if the email is belonged to any of the professor in our professor's catalog
      ProfessorCatalog.findOne(emailQuery, (err, professorCatalog) => {
        //Check if there's a match
        if (professorCatalog) {
          //Init JWT Payload
          const payload = {
            professor: professorCatalog
          };

          //Init newProfessor
          const newProfessor = new Professor({
            firstName: professorCatalog.firstName,
            lastName: professorCatalog.lastName,
            password: '',
            email: professorCatalog.email
          });

          //Sign the payload with JWT
          jwt.sign(payload, config.secretKEY, jwtOptions, (err, token) => {
            if (err) {
              resolveErrorResponse(res, 'Error Professor Account Initialization', 500, err);
            }

            //Save the JWT Token
            const initToken = token;

            //Give the Professor new random password
            const tempPassword = Professor.generatePassword();
            newProfessor.password = bcryptHelper.hashSalt(tempPassword);

            //Save newProfessor in db
            newProfessor.save((err, savedProfessor) => {
              if (err) {
                resolveErrorResponse(res, 'Error Professor Account Initialization', 500, err);
              }

              //Send email
              emailHelper.sendMail(initToken, savedProfessor, tempPassword, (err, info) => {
                if (err) console.error('ERROR sending email: ', err);
              });

              //Response to frontend
              res.status(200).json({
                success: true,
                title: 'success',
                message: 'Successfully Init Professor Account',
                professor: savedProfessor
              });
            });
          });
        } else { //There's no match
          resolveErrorResponse(res, 'Error Professor Account Initialization', 500);
        }
      });
    }
  });
});

//Verify TOKEN
router.post('/verify', (req, res) => {
  //Check and assign TOKEN from queryParam
  const queryToken = req.query.token ? req.query.token : null;
  const emailInput = req.body.email;
  //Check queryToken
  if (queryToken !== null) {
    jwt.verify(queryToken, config.secretKEY, (err, decodedToken) => {
      if (err) {
        resolveErrorResponse(res, 'Error Token Verification', 500, err);
      }

      if (emailInput === decodedToken.professor.email) {
        Professor.getProfByEmail(decodedToken.professor.email, (err, professor) => {
          if (err) {
            resolveErrorResponse(res, 'Error Fetching Prof by Email', 500, err);
          }

          if (!professor) {
            resolveErrorResponse(res, 'There is no Professor by that email in our system', 400);
          }

          //Change professor's verification status
          professor.verified = true;

          //Save to db and response back to frontend
          professor.save((err, savedProfessor) => {
            if (err) {
              resolveErrorResponse(res, 'Error Saving Professor', 500, err);
            }

            res.status(200).json({
              success: true,
              title: 'success',
              message: 'Verified Successfully',
              professor: savedProfessor
            });
          });
        });
      } else {
        resolveErrorResponse(res, 'Not Authorized', 400);
      }
    });
  } else { //QueryToken is null
    resolveErrorResponse(res, 'Token is missing', 400);
  }
});

//Login 
router.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  Professor.getProfByEmail(email, (err, professor) => {
    if (err) {
      resolveErrorResponse(res, 'Error fetching Professor by Email', 500, err);
    }

    if (!professor) {
      resolveErrorResponse(res, 'Please check your login credentials.', 400);
    }

    Professor.comparePasswords(password, professor.password, (err, isMatched) => {
      if (err) {
        resolveErrorResponse(res, 'Error comparing passwords', 500, err);
      }

      if (!isMatched) {
        resolveErrorResponse(res, 'Please check your login credentials.', 400);
      } else {
        const payload = {
          professor: professor
        };

        jwt.sign(payload, config.secretKEY, jwtOptions, (err, token) => {
          if (err) {
            resolveErrorResponse(res, 'Error signing payload with JWT', 500, err);
          }

          professor.lastVisited = momentHelper.getToday();
          professor.save((err, professor) => {
            if (err) console.error(`Error saving professor: ${err}`);

            res.status(200).json({
              success: true,
              title: 'success',
              message: 'Successfully logged in',
              authToken: `JWT ${token}`,
              response: {
                _id: professor._id,
                email: professor.email,
                firstName: professor.firstName,
                lastName: professor.lastName,
                lastVisited: professor.lastVisited,
                verified: professor.verified
              }
            });
          });
        });
      }
    });
  });
});

//Change Password
router.put('/change-password', passport.authenticate('jwt', {
  session: false
}), (req, res) => {
  const candidatePassword = req.body.candidatePassword;
  const currentPassword = req.professor.password;
  const newPassword = req.body.newPassword;

  Professor.comparePasswords(candidatePassword, currentPassword, (err, isMatched) => {
    if (err) {
      resolveErrorResponse(res, 'Error comparing passwords', 500, err);
    }

    if (!isMatched) {
      resolveErrorResponse(res, 'Password does not match', 400);
    } else {
      Professor.changePassword(req.professor._id, newPassword, (err, professor) => {
        if (err) {
          resolveErrorResponse(res, 'Error changing passwords', 500, err);
        }

        res.status(200).json({
          success: true,
          title: 'success',
          message: 'Password changed successfully',
          professor: professor
        });
      });
    }
  });
});

function resolveErrorResponse(res, message, statusCode, error) {
  error = error ? error : null;
  return res.status(statusCode).json({
    success: false,
    title: "error",
    message: message,
    erorr: error
  });
}

module.exports = router;