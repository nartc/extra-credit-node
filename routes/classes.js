const express = require('express');
const router = express.Router();

const Class = require('../models/Class');
// Create Class
router.post('/', (req, res) => {
    console.log(req.body);
    let newClass = new Class({
      name: req.body.name,
      description: req.body.description,
      events: req.body.events,
      professor: 'Professor Joe'
    });
  
    Class.addClass(newClass, (err, result) => {
      if (err) {
          resolveErrorResponse(res, 'Error Adding New Class', 500, err);
      }

      return res.status(200).json({
        success: true,
        title: 'success',
        message: 'Added Class Successfully',
        class: result
      });
    });
  });

function resolveErrorResponse(res, message, statusCode, error) {
    error = error ? error : null;
    return res.status(statusCode).json({
      success: false,
      title: "error",
      message: message,
      error: error
    });
  }

module.exports = router;