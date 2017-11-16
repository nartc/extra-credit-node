const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require("../config/keys");
const emailHelper = require("../helper/email-helper");
const Professor = require("../models/Professor");
const ProfessorCatalog = require("../app");

//JWT Options
const jwtOptions = {
  expiresIn: 18000
};

//Init Professor Account
router.post('/init', (req, res) => {
  const emailInput = req.body.email;
  const emailQuery = {
    email: emailInput
  };

  //Check if there's already a professor with this email in the db
  Professor.getProfByEmail(emailQuery, (err, professor) => {
    if (err) {
      return res.status(500).json({
        success: false,
        title: "error",
        message: "Error Professor Account Initialization",
        erorr: err
      });
    }

    //If there's a professor
    if (professor) {
      //Check to see if this professor's verified
      if (!professor.verified) {
        //Change this professor's temp password if they're not verified
        professor.password = Professor.generatePassword();
        //Save this professor in db
        professor.save((err, savedProfessor) => {
          if (err) {
            return res.status(500).json({
              success: false,
              title: "error",
              message: "Error Professor Account Initialization",
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
                message: "Error Professor Account Initialization",
                erorr: err
              });
            }

            //Assign JWT Token to a Variable
            const initToken = token;
            emailHelper.sendMail(initToken, savedProfessor, (err, info) => {
              if (err) console.error('ERROR sending email: ', err);
            });
          });

          //Response to Frontend
          res.status(200).json({
            success: true,
            title: 'success',
            message: 'Successfully Init Professor Account',
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
          jwt.sign(payload, config.secretKEY.jwtOptions, (err, token) => {
            if (err) {
              return res.status(500).json({
                success: false,
                title: "error",
                message: "Error Professor Account Initialization",
                erorr: err
              });
            }

            //Save the JWT Token
            const initToken = token;

            //Give the Professor new random password
            newProfessor.password = Professor.generatePassword();

            //Save newProfessor in db
            newProfessor.save((err, savedProfessor) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  title: "error",
                  message: "Error Professor Account Initialization",
                  erorr: err
                });
              }

              //Send email
              emailHelper.sendMail(initToken, savedProfessor, (err, info) => {
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
          return res.status(400).destroy();
        }
      });
    }
  });
});

//Verify TOKEN
router.get('/verify', (req, res) => {
  //Check and assign TOKEN from queryParam
  const queryToken = req.query.token ? req.query.token : null;

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

      Professor.getProfByEmail(decodedToken.professor.email, (err, professor) => {
        if (err) {
          return res.status(500).json({
            success: false,
            title: "error",
            message: "Error Fetching Prof by Email",
            erorr: err
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
    });
  } else { //QueryToken is null
    return res.status(400).json({
      success: false,
      title: 'unauthorized',
      message: 'Token is missing'
    });
  }
});

module.exports = router;