const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { sql } = require("../database/neon");

dotenv.config();

const sendOTP = async (email) => {
  if (!email) throw new Error("Email is required");
  console.log("Sending OTP to:", email);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // HTML template for the email
    const htmlContent = `
  <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Crazy Codequest</h1>
          <p style="margin: 0; font-size: 16px;">Your One-Time Password (OTP)</p>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 16px;">Thank you for using Crazy Codequest. Your OTP code is:</p>
          <div style="font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 16px;">This OTP will expire in <strong>5 minutes</strong>.</p>
          <p style="font-size: 16px;">If you did not request this OTP, please ignore this email.</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888;">
          <p style="margin: 0;">This is an automated email. Please do not reply.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Crazy Codequest. All rights reserved.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Crazy Codequest" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: htmlContent, // Use the HTML content here
    });

    await sql`
      INSERT INTO email_verification (email, otp, expires_at)
      VALUES (${email}, ${otp}, ${expiresAt})
      ON CONFLICT (email)
      DO UPDATE SET otp = ${otp}, expires_at = ${expiresAt}
    `;

    return { message: "OTP sent successfully" };
  } catch (err) {
    console.error("Error sending OTP:", err.message);
    throw new Error("Failed to send OTP");
  }
};

const verifyOtp = async (email, otp) => {
  if (!email || !otp) {
    throw new Error("Email and OTP are required.");
  }

  try {
    const result = await sql`
      SELECT * FROM email_verification
      WHERE email = ${email}
    `;

    const record = result[0];

    if (!record) {
      throw new Error("No OTP found for this email.");
    }

    if (record.otp !== otp) {
      throw new Error("Invalid OTP.");
    }

    if (new Date(record.expires_at) < new Date()) {
      throw new Error("OTP has expired");
    }

    await sql`
      UPDATE users
      SET otp_verified = TRUE
      WHERE email = ${email}
    `;

    await sql`
      DELETE FROM email_verification
      WHERE email = ${email}
    `;

    return { message: "OTP verified successfully" };
  } catch (error) {
    console.error("OTP verification error:", error.message);
    throw new Error(error.message);
  }
};



module.exports = {
  sendOTP,
  verifyOtp
};
