
const express = require("express");
const db = require("../config/db");
const { authenticateToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const [sensors] = await db.execute(
      "SELECT * FROM sensors ORDER BY id DESC"
    );
    res.json({ success: true, sensors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load sensors" });
  }
});

router.post("/", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, location, lat, lon, status } = req.body;

    if (!name || !location || !Number.isFinite(Number(lat)) ||
        !Number.isFinite(Number(lon)) ||
        Number(lat) < -90 || Number(lat) > 90 ||
        Number(lon) < -180 || Number(lon) > 180) {
      return res.status(400).json({
        success: false,
        message: "Valid sensor details required"
      });
    }

    const [result] = await db.execute(
      `INSERT INTO sensors
       (name, location, lat, lon, status)
       VALUES (?, ?, ?, ?, ?)`,
      [name, location, lat, lon, status || "Active"]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: "Sensor added"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not add sensor" });
  }
});

router.put("/:id", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, location, lat, lon, status } = req.body;

    const [result] = await db.execute(
      `UPDATE sensors SET name=?, location=?, lat=?, lon=?, status=?
       WHERE id=?`,
      [name, location, lat, lon, status, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Sensor not found" });
    }

    res.json({ success: true, message: "Sensor updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not update sensor" });
  }
});

router.delete("/:id", authenticateToken, adminOnly, async (req, res) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM sensors WHERE id=?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Sensor not found" });
    }

    res.json({ success: true, message: "Sensor deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not delete sensor. Check its existing readings."
    });
  }
});

module.exports = router;
