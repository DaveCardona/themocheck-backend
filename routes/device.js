const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ─────────────────────────────────────────────
   OBTENER TAREA PARA ESP32 (NEXT TASK)
───────────────────────────────────────────── */

router.get("/device/next-task", async (req, res) => {
  const client = await pool.connect();

  try {
    const { device_id } = req.query;

    if (!device_id) {
      return res.status(400).json({
        success: false,
        message: "device_id requerido"
      });
    }

    await client.query("BEGIN");

    //  TOMAR 1 JOB LIBRE SIN RACE CONDITIONS
    const result = await client.query(`
      SELECT id, token, id_usuario
      FROM sesiones_medicion
      WHERE estado = 'pendiente'
        AND expires_at > NOW()
      ORDER BY id ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "No hay tareas disponibles"
      });
    }

    const device = await pool.query(`
  SELECT activo
  FROM dispositivos
  WHERE device_id = $1
`, [device_id]);

    if (device.rows.length === 0 || !device.rows[0].activo) {
      return res.status(403).json({
        success: false,
        message: "Dispositivo no autorizado"
      });
    }

    const job = result.rows[0];

    // ASIGNAR A ESTE DISPOSITIVO
    await client.query(`
      UPDATE sesiones_medicion
      SET estado = 'asignado',
          device_id = $1,
          assigned_at = NOW()
      WHERE id = $2
    `, [device_id, job.id]);

    await client.query("COMMIT");

    return res.json({
      success: true,
      token: job.token,
      id_usuario: job.id_usuario
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ERROR NEXT TASK:", err);

    return res.status(500).json({
      success: false
    });

  } finally {
    client.release();
  }
});

module.exports = router;