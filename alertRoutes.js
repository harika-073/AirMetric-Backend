
const express = require("express");
const db = require("../config/db");
const { authenticateToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const [alerts] = await db.execute(`
      SELECT a.id, a.sensor_id AS sensorId,
             a.reading_id AS readingId, a.type,
             a.message, a.severity, a.date, a.status
      FROM alerts a
      ORDER BY a.date DESC
    `);

    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load alerts" });
  }
});

router.patch("/:id/status", authenticateToken, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Open", "Resolved"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const [result] = await db.execute(
      "UPDATE alerts SET status=? WHERE id=?",
      [status, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    res.json({ success: true, message: "Alert updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not update alert" });
  }
});

module.exports = router;
