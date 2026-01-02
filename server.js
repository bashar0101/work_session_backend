const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: true, // Allow all origins (change to specific origin in production)
    credentials: true, // Allow cookies to be sent
  })
);
app.use(express.json());
app.use(cookieParser());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  })
  .then(() => {
    console.log("MongoDB Connected successfully");
    console.log(`Connected to: ${MONGODB_URI}`);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    console.error("\n⚠️  Please make sure:");
    console.error("   1. MongoDB is installed and running");
    console.error(
      "   2. MongoDB service is started (try: mongod or net start MongoDB)"
    );
    console.error("   3. Connection string is correct in .env file");
    console.error(`   4. Current connection string: ${MONGODB_URI}`);
    process.exit(1);
  });

// Routes (loaded after connection attempt)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/work", require("./routes/work"));
app.use("/api/users", require("./routes/users"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
