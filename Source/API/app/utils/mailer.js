const nodemailer = require('nodemailer');
const dns = require('dns');
require('dotenv').config({path: '../../.env'});

dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  
  connectionTimeout: 10000,
});

const sendMail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: "Projeto FOCA",
      to: to,
      subject: subject,
      html: htmlContent,
    });

    console.log(`[Email] Message sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    throw error;
  }
};

module.exports = { sendMail };