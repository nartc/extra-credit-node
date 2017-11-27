const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');

const config = require('../config/keys');
const momentHelper = require('../helper/moment-helper');

const Student = require('../models/Student');

//JWT Options
const jwtOptions = {
  expiresIn: 18000
};

//Register
router.post('/register', (req, res) => {
  console.log(req.body);
  let newStudent = new Student({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password
  });

  Student.registerStudent(newStudent, (err, student) => {
    if (err) {
      return res.status(500).json({
        success: false,
        title: 'error',
        message: 'Error registering new student',
        error: err.errmsg
      });
    }

    res.status(200).json({
      success: true,
      title: 'success',
      message: 'Registered successfully',
      student: student
    });
  });
});

//Login
router.post('/login', (req, res) => {
  console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;

  Student.getStudentByEmail(email, (err, student) => {
    if (err) {
      return res.status(500).json({
        success: false,
        title: 'error',
        message: 'Error fetching student by email', 
        error: err.errmsg
      });
    }

    if (!student) {
      return res.status(400).json({
        success: false,
        title: 'error',
        message: 'Please check your credentials'
      });
    }

    Student.comparePasswords(password, student.password, (err, isMatched) => {
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
          student: student
        }

        jwt.sign(payload, config.secretKEY, jwtOptions, (err, token) => {
          if (err) {
            return res.status(500).json({
              success: false,
              title: 'error',
              message: 'Error signing payload with JWT',
              error: err
            });
          }

          student.lastVisited = momentHelper.getToday();
          student.save((err, student) => {
            if (err) console.error(`Error saving student: ${err}`);

            res.status(200).json({
              success: true,
              title: 'success',
              message: 'Successfully logged in',
              authToken: `JWT ${token}`,
              response: {
                _id: student._id,
                email: student.email,
                firstName: student.firstName,
                lastName: student.lastName,
                lastVisited: student.lastVisited
              }
            });
          });
        });
      }
    });
  });
});

//Change Password
router.put('/change-password', passport.authenticate('jwt', {session: false}), (req, res) => {
  console.log(req.user);
  const currentPassword = req.user.password;
  const candidatePassword = req.body.candidatePassword;
  const newPassword = req.body.newPassword;

  Student.comparePasswords(candidatePassword, currentPassword, (err, isMatched) => {
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
      Student.changePassword(req.user._id, newPassword, (err, student) => {
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
          student: student
        });
      });
    }
  });
});

module.exports = router;