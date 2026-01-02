const express = require("express");
const WorkSession = require("../models/WorkSession");
const User = require("../models/User");
const auth = require("../middleware/auth");
const manager = require("../middleware/manager");
const router = express.Router();

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

// Helper function to calculate hours between two dates
const calculateHours = (startTime, endTime) => {
  const diff = endTime - startTime;
  return diff / (1000 * 60 * 60); // Convert milliseconds to hours
};

// Start work
router.post("/start", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const today = formatDate(now);

    // Check if user has an active session
    const activeSession = await WorkSession.findOne({
      user: userId,
      isActive: true,
    });

    if (activeSession) {
      return res.status(400).json({
        message:
          "You already have an active work session. Please end it before starting a new one.",
      });
    }

    // Create new work session
    const workSession = new WorkSession({
      user: userId,
      startTime: now,
      date: today,
      isActive: true,
    });

    await workSession.save();

    res.status(201).json({
      message: "Work session started",
      session: {
        id: workSession._id,
        startTime: workSession.startTime,
        date: workSession.date,
      },
    });
  } catch (error) {
    console.error("Start work error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// End work
router.post("/end", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Find active session
    const activeSession = await WorkSession.findOne({
      user: userId,
      isActive: true,
    });

    if (!activeSession) {
      return res.status(400).json({
        message:
          "No active work session found. Please start a work session first.",
      });
    }

    // Calculate total hours
    const totalHours = calculateHours(activeSession.startTime, now);

    // Update session
    activeSession.endTime = now;
    activeSession.totalHours = totalHours;
    activeSession.isActive = false;

    await activeSession.save();

    res.json({
      message: "Work session ended",
      session: {
        id: activeSession._id,
        startTime: activeSession.startTime,
        endTime: activeSession.endTime,
        totalHours: parseFloat(totalHours.toFixed(2)),
        date: activeSession.date,
      },
    });
  } catch (error) {
    console.error("End work error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get daily working hours
router.get("/daily", auth, async (req, res) => {
  try {
    const { date, userId } = req.query; // userId is optional, for managers
    let targetUserId = req.user._id;

    // If user is manager and userId is provided, use that userId
    if (req.user.role === "manager" && userId) {
      targetUserId = userId;
    }

    let query = { user: targetUserId, isActive: false };

    if (date) {
      query.date = date;
    }

    const sessions = await WorkSession.find(query)
      .populate("user", "name lastname email")
      .sort({ date: -1, startTime: -1 });

    // Group by year, month, and date
    const yearlyData = {};
    
    sessions.forEach((session) => {
      const dateObj = new Date(session.date);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1; // 1-12
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const date = session.date;

      // Initialize year
      if (!yearlyData[year]) {
        yearlyData[year] = {};
      }

      // Initialize month
      if (!yearlyData[year][monthKey]) {
        yearlyData[year][monthKey] = {
          year,
          month,
          monthKey,
          totalHours: 0,
          daysWorked: 0,
          dailyHours: {},
        };
      }

      // Initialize day
      if (!yearlyData[year][monthKey].dailyHours[date]) {
        yearlyData[year][monthKey].dailyHours[date] = {
          date,
          totalHours: 0,
          sessions: [],
        };
        yearlyData[year][monthKey].daysWorked++;
      }

      // Add session data
      yearlyData[year][monthKey].dailyHours[date].totalHours += session.totalHours;
      yearlyData[year][monthKey].dailyHours[date].sessions.push({
        id: session._id,
        startTime: session.startTime,
        endTime: session.endTime,
        hours: session.totalHours,
      });

      yearlyData[year][monthKey].totalHours += session.totalHours;
    });

    // Convert to array format
    const result = Object.keys(yearlyData)
      .sort((a, b) => parseInt(b) - parseInt(a)) // Sort years descending
      .map((year) => ({
        year: parseInt(year),
        months: Object.values(yearlyData[year])
          .sort((a, b) => b.month - a.month) // Sort months descending
          .map((monthData) => ({
            year: monthData.year,
            month: monthData.month,
            monthKey: monthData.monthKey,
            totalHours: parseFloat(monthData.totalHours.toFixed(2)),
            daysWorked: monthData.daysWorked,
            dailyHours: Object.values(monthData.dailyHours)
              .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort days descending
              .map((day) => ({
                date: day.date,
                totalHours: parseFloat(day.totalHours.toFixed(2)),
                sessions: day.sessions,
              })),
          })),
      }));

    res.json({
      message: "Daily working hours retrieved",
      data: result,
    });
  } catch (error) {
    console.error("Get daily hours error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get current active session
router.get("/current", auth, async (req, res) => {
  try {
    const { userId } = req.query; // userId is optional, for managers
    let targetUserId = req.user._id;

    // If user is manager and userId is provided, use that userId
    if (req.user.role === "manager" && userId) {
      targetUserId = userId;
    }

    const activeSession = await WorkSession.findOne({
      user: targetUserId,
      isActive: true,
    }).populate("user", "name lastname email");

    if (!activeSession) {
      return res.json({
        message: "No active session",
        session: null,
      });
    }

    // Calculate current hours if session is still active
    const now = new Date();
    const currentHours = calculateHours(activeSession.startTime, now);

    res.json({
      message: "Active session found",
      session: {
        id: activeSession._id,
        startTime: activeSession.startTime,
        currentHours: parseFloat(currentHours.toFixed(2)),
        date: activeSession.date,
        user:
          req.user.role === "manager"
            ? {
                id: activeSession.user._id,
                name: activeSession.user.name,
                lastname: activeSession.user.lastname,
                email: activeSession.user.email,
              }
            : undefined,
      },
    });
  } catch (error) {
    console.error("Get current session error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all users (Manager only)
router.get("/users", auth, manager, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ lastname: 1, name: 1 }); // Sort by lastname, then name

    res.json({
      message: "Users retrieved successfully",
      users: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all work sessions (Manager only)
router.get("/all-sessions", auth, manager, async (req, res) => {
  try {
    const { date, userId } = req.query;
    let query = { isActive: false };

    if (userId) {
      query.user = userId;
    }

    if (date) {
      query.date = date;
    }

    const sessions = await WorkSession.find(query)
      .populate("user", "name lastname email")
      .sort({ date: -1, startTime: -1 });

    // Group by user, year, month, and date
    const userSessions = {};
    
    sessions.forEach((session) => {
      const userKey = session.user._id.toString();
      if (!userSessions[userKey]) {
        userSessions[userKey] = {
          user: {
            id: session.user._id,
            name: session.user.name,
            lastname: session.user.lastname,
            email: session.user.email,
          },
          yearlyData: {},
          totalHours: 0,
        };
      }

      const dateObj = new Date(session.date);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const date = session.date;

      // Initialize year
      if (!userSessions[userKey].yearlyData[year]) {
        userSessions[userKey].yearlyData[year] = {};
      }

      // Initialize month
      if (!userSessions[userKey].yearlyData[year][monthKey]) {
        userSessions[userKey].yearlyData[year][monthKey] = {
          year,
          month,
          monthKey,
          totalHours: 0,
          daysWorked: 0,
          dailyHours: {},
        };
      }

      // Initialize day
      if (!userSessions[userKey].yearlyData[year][monthKey].dailyHours[date]) {
        userSessions[userKey].yearlyData[year][monthKey].dailyHours[date] = {
          date,
          totalHours: 0,
          sessions: [],
        };
        userSessions[userKey].yearlyData[year][monthKey].daysWorked++;
      }

      // Add session data
      userSessions[userKey].yearlyData[year][monthKey].dailyHours[date].totalHours +=
        session.totalHours;
      userSessions[userKey].yearlyData[year][monthKey].dailyHours[date].sessions.push({
        id: session._id,
        startTime: session.startTime,
        endTime: session.endTime,
        hours: session.totalHours,
      });

      userSessions[userKey].yearlyData[year][monthKey].totalHours += session.totalHours;
      userSessions[userKey].totalHours += session.totalHours;
    });

    // Convert to array format and sort by name, lastname
    const result = Object.values(userSessions)
      .sort((a, b) => {
        // Sort by lastname first, then name
        if (a.user.lastname.toLowerCase() !== b.user.lastname.toLowerCase()) {
          return a.user.lastname.localeCompare(b.user.lastname);
        }
        return a.user.name.localeCompare(b.user.name);
      })
      .map((userData) => ({
        user: userData.user,
        totalHours: parseFloat(userData.totalHours.toFixed(2)),
        yearlyData: Object.keys(userData.yearlyData)
          .sort((a, b) => parseInt(b) - parseInt(a)) // Sort years descending
          .map((year) => ({
            year: parseInt(year),
            months: Object.values(userData.yearlyData[year])
              .sort((a, b) => b.month - a.month) // Sort months descending
              .map((monthData) => ({
                year: monthData.year,
                month: monthData.month,
                monthKey: monthData.monthKey,
                totalHours: parseFloat(monthData.totalHours.toFixed(2)),
                daysWorked: monthData.daysWorked,
                dailyHours: Object.values(monthData.dailyHours)
                  .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort days descending
                  .map((day) => ({
                    date: day.date,
                    totalHours: parseFloat(day.totalHours.toFixed(2)),
                    sessions: day.sessions,
                  })),
              })),
          })),
      }));

    res.json({
      message: "All work sessions retrieved",
      data: result,
    });
  } catch (error) {
    console.error("Get all sessions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
