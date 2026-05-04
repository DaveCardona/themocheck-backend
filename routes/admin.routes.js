const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ───────────── STATS DASHBOARD ───────────── */

router.get("/admin/stats", async (req, res) => {
  try {

    // 🔹 Total, promedio, máximo
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        AVG(temperatura) as promedio,
        MAX(temperatura) as max_temp
      FROM medidas
      WHERE fecha >= NOW() - INTERVAL '1 day'
    `);

    // 🔹 Alertas (>= 37.5)
    const alertas = await pool.query(`
      SELECT COUNT(*) as alertas
      FROM medidas
      WHERE temperatura >= 37.5
      AND fecha >= NOW() - INTERVAL '1 day'
    `);

    // 🔹 Usuario con temperatura más alta
    const max = await pool.query(`
      SELECT 
        CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
        m.temperatura
      FROM medidas m
      JOIN usuarios u ON u.id_usuario = m.id_usuario
      ORDER BY m.temperatura DESC
      LIMIT 1
    `);

    res.json({
      success: true,
      data: {
        total: parseInt(stats.rows[0].total) || 0,
        promedio: stats.rows[0].promedio 
          ? parseFloat(stats.rows[0].promedio) 
          : null,
        max_temp: stats.rows[0].max_temp 
          ? parseFloat(stats.rows[0].max_temp) 
          : null,
        max_user: max.rows[0]?.nombre_completo || null,
        alertas: parseInt(alertas.rows[0].alertas) || 0
      }
    });

  } catch (err) {
    console.error("ERROR ADMIN STATS:", err);
    res.status(500).json({
      success: false,
      message: "Error obteniendo estadísticas"
    });
  }
});

module.exports = router;