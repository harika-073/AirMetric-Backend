
const express = require("express");
const db = require("../config/db");
const { authenticateToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const [readings] = await db.execute(`
      SELECT r.id, r.sensor_id AS sensorId, r.date,
             r.pm25, r.pm10, r.co2, r.aqi
      FROM readings r
      ORDER BY r.date DESC
    `);

    res.json({ success: true, readings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load readings" });
  }
});

router.post("/", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { sensorId, date, pm25, pm10, co2, aqi } = req.body;

    const values = [pm25, pm10, co2, aqi].map(Number);

    if (!sensorId || !date ||
        values.some(v => !Number.isFinite(v) || v < 0)) {
      return res.status(400).json({
        success: false,
        message: "Valid sensor, date and pollution values required"
      });
    }

    const [result] = await db.execute(
      `INSERT INTO readings
       (sensor_id, date, pm25, pm10, co2, aqi)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sensorId, date, ...values]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: "Reading saved"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Could not save reading" });
  }
});

router.delete("/:id", authenticateToken, adminOnly, async (req, res) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM readings WHERE id=?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Reading not found" });
    }

    res.json({ success: true, message: "Reading deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete reading" });
  }
});

module.exports = router;
