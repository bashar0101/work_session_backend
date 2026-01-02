// const nodemailer = require("nodemailer");

// // Create transporter
// const createTransporter = () => {
//   return nodemailer.createTransport({
//     host: process.env.SMTP_HOST || "smtp.gmail.com",
//     port: process.env.SMTP_PORT || 587,
//     secure: false, // true for 465, false for other ports
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });
// };

// // Send verification email
// const sendVerificationEmail = async (email, name, token) => {
//   try {
//     const transporter = createTransporter();
//     const verificationUrl = `${
//       process.env.FRONTEND_URL || "http://localhost:3000"
//     }/verify-email?token=${token}`;

//     const mailOptions = {
//       from: `"Working Hours Tracker" <${process.env.SMTP_USER}>`,
//       to: email,
//       subject: "Verify Your Email Address",
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #333;">Hello ${name},</h2>
//           <p>Thank you for registering with Working Hours Tracker!</p>
//           <p>Please verify your email address by clicking the link below:</p>
//           <p style="margin: 30px 0;">
//             <a href="${verificationUrl}"
//                style="background-color: #4CAF50; color: white; padding: 12px 24px;
//                       text-decoration: none; border-radius: 5px; display: inline-block;">
//               Verify Email Address
//             </a>
//           </p>
//           <p>Or copy and paste this link into your browser:</p>
//           <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
//           <p style="color: #999; font-size: 12px; margin-top: 30px;">
//             This link will expire in 24 hours.
//           </p>
//           <p style="color: #999; font-size: 12px;">
//             If you didn't create an account, please ignore this email.
//           </p>
//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Verification email sent to ${email}`);
//   } catch (error) {
//     console.error("Error sending verification email:", error);
//     throw error;
//   }
// };

// // Send password reset email
// const sendPasswordResetEmail = async (email, name, token) => {
//   try {
//     const transporter = createTransporter();
//     const resetUrl = `${
//       process.env.FRONTEND_URL || "http://localhost:3000"
//     }/reset-password?token=${token}`;

//     const mailOptions = {
//       from: `"Working Hours Tracker" <${process.env.SMTP_USER}>`,
//       to: email,
//       subject: "Reset Your Password",
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #333;">Hello ${name},</h2>
//           <p>You requested to reset your password for Working Hours Tracker.</p>
//           <p>Click the link below to reset your password:</p>
//           <p style="margin: 30px 0;">
//             <a href="${resetUrl}"
//                style="background-color: #2196F3; color: white; padding: 12px 24px;
//                       text-decoration: none; border-radius: 5px; display: inline-block;">
//               Reset Password
//             </a>
//           </p>
//           <p>Or copy and paste this link into your browser:</p>
//           <p style="color: #666; word-break: break-all;">${resetUrl}</p>
//           <p style="color: #999; font-size: 12px; margin-top: 30px;">
//             This link will expire in 1 hour.
//           </p>
//           <p style="color: #999; font-size: 12px;">
//             If you didn't request a password reset, please ignore this email.
//           </p>
//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Password reset email sent to ${email}`);
//   } catch (error) {
//     console.error("Error sending password reset email:", error);
//     throw error;
//   }
// };

// module.exports = {
//   sendVerificationEmail,
//   sendPasswordResetEmail,
// };

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Working Hours Tracker <onboarding@resend.dev>";

// Send verification email
const sendVerificationEmail = async (email, name, token) => {
  try {
    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/verify-email?token=${token}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello ${name},</h2>
          <p>Thank you for registering with Working Hours Tracker!</p>
          <p>Please verify your email address by clicking the link below:</p>
          <p style="margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours.
          </p>
          <p style="color: #999; font-size: 12px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, token) => {
  try {
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${token}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello ${name},</h2>
          <p>You requested to reset your password for Working Hours Tracker.</p>
          <p>Click the link below to reset your password:</p>
          <p style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2196F3; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 1 hour.
          </p>
          <p style="color: #999; font-size: 12px;">
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
