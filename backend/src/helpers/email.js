const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

const templatesDir = path.join(__dirname, "../templates/emails");

const sendEmail = async ({ to, subject, template, data, text }) => {
  const html = await ejs.renderFile(path.join(templatesDir, `${template}.ejs`), data);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    text,
  });
};

module.exports = sendEmail;
