const nodeMailer = require("nodemailer");

const mailOptions = {
  from: "testingextracred@gmail.com",
  to: "",
  subject: "",
  html: ""
};
//Init Nodemailer
const mailTransporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: "testingextracred@gmail.com",
    pass: "123456test"
  }
});

//Init Mail Options
module.exports.sendMail = (token, user, tempPassword, callback) => {
  const verifyUrl = `http://localhost:3000/professors/verify?token=${token}`;
  let htmlBody = `
  <p>Hi Professor ${user.name},</p>
  <br>
  <br>
  <p> Please click the link below:</p>
  <a target="_blank" href="${verifyUrl}">${verifyUrl}</a>
  <br>
  <p> Your temporary password: <strong>${tempPassword}</strong></p>
  <br>
  <p> Thank you </p>
`;

  mailOptions.html = htmlBody;
  mailOptions.to = "ctran2428@gmail.com"; // Need to change this to user.email later

  mailTransporter.sendMail(mailOptions, callback);
};