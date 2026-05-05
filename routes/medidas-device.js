const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ─────────────────────────────────────────────
   ESP32 ENVÍA MEDICIÓN
───────────────────────────────────────────── */

router.post("/medidas-device", async (req, res) => {
  try {
    const { token, temperatura, device_id } = req.body;

    if (!token || temperatura === undefined) {
      return res.status(400).json({
        success: false,
        message: "Datos incompletos"
      });
    }

    if (isNaN(temperatura)) {
      return res.status(400).json({
        success: false,
        message: "Temperatura inválida"
      });
    }

    //  VALIDAR JOB
    const job = await pool.query(`
      SELECT id_usuario, estado
      FROM sesiones_medicion
      WHERE token = $1
        AND expires_at > NOW()
    `, [token]);

    if (job.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Token inválido"
      });
    }

    const { id_usuario } = job.rows[0];

    //  LÍMITE DIARIO
    const count = await pool.query(`
      SELECT COUNT(*) 
      FROM medidas 
      WHERE id_usuario = $1
        AND DATE(created_at) = CURRENT_DATE
    `, [id_usuario]);

    if (parseInt(count.rows[0].count) >= 3) {
      return res.status(403).json({
        success: false,
        message: "Límite diario alcanzado"
      });
    }

    //  GUARDAR MEDIDA
    await pool.query(`
      INSERT INTO medidas (id_usuario, temperatura)
      VALUES ($1, $2)
    `, [id_usuario, temperatura]);

    //  COMPLETAR JOB
    await pool.query(`
      UPDATE sesiones_medicion
      SET estado = 'completado',
          completed_at = NOW()
      WHERE token = $1
    `, [token]);

    //  ALERTA
    if (temperatura >= 37.5) {
      await pool.query(`
        INSERT INTO alertas (id_usuario, temperatura, mensaje)
        VALUES ($1, $2, $3)
      `, [
        id_usuario,
        temperatura,
        "Paciente con posible fiebre"
      ]);
    }

    return res.json({
      success: true,
      message: "Medición registrada"
    });

  } catch (error) {
    console.error("ERROR MEDIDAS DEVICE:", error);
    return res.status(500).json({
      success: false
    });
  }
});

module.exports = router;