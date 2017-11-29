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
      return res.status(500).json({
        success: false,
        title: "error",
        message: "Error Professor Account Initialization (1)",
        erorr: err
      });
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
            return res.status(500).json({
              success: false,
              title: "error",
              message: "Error Professor Account Initialization (2)",
              erorr: err
            });
          }

          //If savedProfessor, init payload for JWT
          const payload = {
            professor: savedProfessor
          };

          //Generate JWT Token
          jwt.sign(payload, config.secretKEY, jwtOptions, (err, token) => {
            if (err) {
              return res.status(500).json({
                success: false,
                title: "error",
                message: "Error Professor Account Initialization (3)",
                erorr: err
              });
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
        return res.status(400).json({
          success: false,
          title: 'error',
          message: 'You are already verified'
        });
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
              return res.status(500).json({
                success: false,
                title: "error",
                message: "Error Professor Account Initialization (4)",
                erorr: err
              });
            }

            //Save the JWT Token
            const initToken = token;

            //Give the Professor new random password
            const tempPassword = Professor.generatePassword();
            newProfessor.password = bcryptHelper.hashSalt(tempPassword);

            //Save newProfessor in db
            newProfessor.save((err, savedProfessor) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  title: "error",
                  message: "Error Professor Account Initialization (5)",
                  erorr: err
                });
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
          return res.status(500).json({
            success: false,
            title: 'error',
            message: 'Error Professor Account Initialization (6)'
          });
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
        return res.status(500).json({
          success: false,
          title: "error",
          message: "Error Token Verification",
          erorr: err
        });
      }

      if (emailInput === decodedToken.professor.email) {
        Professor.getProfByEmail(decodedToken.professor.email, (err, professor) => {
          if (err) {
            return res.status(500).json({
              success: false,
              title: "error",
              message: "Error Fetching Prof by Email",
              erorr: err
            });
          }

          if (!professor) {
            return res.status(500).json({
              success: false,
              title: "error",
              message: "There is no Professor by that email in our system"
            });
          }

          //Change professor's verification status
          professor.verified = true;

          //Save to db and response back to frontend
          professor.save((err, savedProfessor) => {
            if (err) {
              return res.status(500).json({
                success: false,
                title: "error",
                message: "Error Saving Professor",
                erorr: err
              });
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
        return res.status(400).json({
          success: false,
          title: "error",
          message: "Not Authorized"
        });
      }
    });
  } else { //QueryToken is null
    return res.status(400).json({
      success: false,
      title: 'error',
      message: 'Token is missing'
    });
  }
});

//Login 
router.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  Professor.getProfByEmail(email, (err, professor) => {
    if (err) {
      return res.status(500).json({
        success: false,
        title: 'error',
        message: 'Error fetching Professor by Email',
        error: err
      });
    }

    if (!professor) {
      return res.status(400).json({
        success: false,
        title: 'error',
        message: 'Please check your login credentials.'
      });
    }

    Professor.comparePasswords(password, professor.password, (err, isMatched) => {
      if (err) {
        return res.status(500).json({
          success: false,
          title: 'error',
          message: 'Error comparing passwords',
          error: err
        });
      }

      if (!isMatched) {
        return res.status(400).json({
          succes: false,
          title: 'error',
          message: 'Please check your login credentials.'
        });
      } else {
        const payload = {
          professor: professor
        };

        jwt.sign(payload, config.secretKEY, jwtOptions, (err, token) => {
          if (err) {
            return res.status(500).json({
              success: false,
              title: 'error',
              message: 'Error signing payload with JWT',
              error: err
            });
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
      return res.status(500).json({
        success: false,
        title: 'error',
        message: 'Error comparing passwords',
        error: err
      });
    }

    if (!isMatched) {
      return res.status(400).json({
        success: false,
        title: 'error',
        message: 'Password does not match'
      });
    } else {
      Professor.changePassword(req.professor._id, newPassword, (err, professor) => {
        if (err) {
          return res.status(500).json({
            success: false,
            title: 'error',
            message: 'Error changing passwords',
            error: err
          });
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

module.exports = router;