import nodemailer from "nodemailer";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Convert __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({
  path: path.join(__dirname, "../config/.env"),
});

export default async function sendEmail(subject, text, sendTo = "customcatcherrors@simplelists.com") {
  // Create a transporter object
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // use TLS
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
    subject,
    text,
  };

  try {
    // Send the email and wait for the result
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // propagate error
  }
}
