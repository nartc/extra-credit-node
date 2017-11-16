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
module.exports.sendMail = (token, user, callback) => {
  const verifyUrl = `http://localhost:4200/professors/verify?token=${token}`;
  let htmlBody = `
  <p>Hi Professor ${user.name},</p>
  <br>
  <br>
  <p> Please click the link below:</p>
  <a target="_blank" href="${verifyUrl}">${verifyUrl}</a>
  <br>
  <p> Your temporary password: <strong>${user.password}</strong></p>
  <br>
  <p> Thank you </p>
`;

  mailOptions.html = htmlBody;
  mailOptions.to = "ctran2428@gmail.com";

  mailTransporter.sendMail(mailOptions, callback);
};