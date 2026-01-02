const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, name, lastname, password } = req.body;

    // Validation
    if (!email || !name || !lastname || !password) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 hours

    // Create user
    const user = new User({
      email,
      name,
      lastname,
      password,
      verificationToken,
      verificationTokenExpiry,
    });

    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (error) {
      console.error("Failed to send verification email:", error);
      // Continue even if email fails
    }

    // Log verification token in development (for testing)
    if (process.env.NODE_ENV !== "production") {
      console.log("\n=== EMAIL VERIFICATION TOKEN (Development Only) ===");
      console.log(`Email: ${email}`);
      console.log(`Token: ${verificationToken}`);
      console.log(
        `Verification URL: ${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/verify-email?token=${verificationToken}`
      );
      console.log("==================================================\n");
    }

    const response = {
      message:
        "User registered successfully. Please check your email to verify your account.",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        lastname: user.lastname,
        role: user.role,
        isVerified: user.isVerified,
      },
    };

    // Include token in response for development/testing (remove in production!)
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.INCLUDE_TOKEN_IN_RESPONSE === "true"
    ) {
      response.verificationToken = verificationToken;
      response.verificationUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/verify-email?token=${verificationToken}`;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if email is verified (optional - you can remove this if you want to allow unverified logins)
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email address before logging in.",
        isVerified: false,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "365s" }
    );

    // Set token in httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        lastname: user.lastname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0), // Expire immediately
  });
  res.json({ message: "Logged out successfully" });
});

// Verify email
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is required" });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token",
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    // Generate JWT token and set cookie
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "365d" }
    );

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Email verified successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        lastname: user.lastname,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Resend verification email
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message:
          "If an account exists with this email, a verification link has been sent.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (error) {
      console.error("Failed to send verification email:", error);
      return res.status(500).json({
        message: "Failed to send verification email",
      });
    }

    // Log verification token in development (for testing)
    if (process.env.NODE_ENV !== "production") {
      console.log("\n=== EMAIL VERIFICATION TOKEN (Development Only) ===");
      console.log(`Email: ${user.email}`);
      console.log(`Token: ${verificationToken}`);
      console.log(
        `Verification URL: ${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/verify-email?token=${verificationToken}`
      );
      console.log("==================================================\n");
    }

    res.json({
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Request password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      return res.status(500).json({
        message: "Failed to send password reset email",
      });
    }

    res.json({
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiry = null;
    await user.save();

    res.json({
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get current user info
router.get("/me", require("../middleware/auth"), (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      lastname: req.user.lastname,
      role: req.user.role,
      isVerified: req.user.isVerified,
    },
  });
});

module.exports = router;
