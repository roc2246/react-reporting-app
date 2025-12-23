const nodemailer = require("nodemailer");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../config/.env"),
});

module.exports = async (subject, text, sendTo = "customcatcherrors@simplelists.com") => {
  // Create a transporter object
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
      user: "childswebdev.ccerrors@gmail.com",
      pass: process.env.APP_PASSWORD,
    },
    requireTLS: true, 
  });

  // Set up the email options
  const mailOptions = {
    from: "childswebdev.ccerrors@gmail.com",
    to: sendTo,
    subject: subject,
    text: text,
  };

  try {
    // Send the email and wait for the result
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Ensure errors are propagated for the calling function to handle
  }
};
