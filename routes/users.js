const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const manager = require("../middleware/manager");
const router = express.Router();

// Update user role by email (Manager only)
router.put("/role", auth, manager, async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (!role || !["user", "manager"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be 'user' or 'manager'",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({
      message: "User role updated successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        lastname: user.lastname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
