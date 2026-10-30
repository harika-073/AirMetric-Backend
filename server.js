
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./config/db");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AirMetric API is running"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ success: true, database: "connected" });
  } catch {
    res.status(500).json({ success: false, database: "disconnected" });
  }
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/sensors", require("./routes/sensorRoutes"));
app.use("/api/readings", require("./routes/readingRoutes"));
app.use("/api/alerts", require("./routes/alertRoutes"));

async function startServer() {
  try {
    await db.query("SELECT 1");

    // Create the initial admin account once, if configured.
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const email = process.env.ADMIN_EMAIL.trim().toLowerCase();

      const [rows] = await db.execute(
        "SELECT id FROM users WHERE email=?",
        [email]
      );

      if (!rows.length) {
        const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

        await db.execute(
          "INSERT INTO users (name,email,password,role) VALUES (?,?,?,'admin')",
          [process.env.ADMIN_NAME || "AirMetric Admin", email, hash]
        );

        console.log("Initial admin account created.");
      }
    }

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`AirMetric API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
