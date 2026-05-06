const express = require("express");
const router = express.Router();
const pool = require("../db");
const crypto = require("crypto");

/* ─────────────────────────────────────────────
   ESP32 ENVÍA MEDICIÓN (VERSIÓN SEGURA)
───────────────────────────────────────────── */

router.post("/medidas-device", async (req, res) => {
  try {
    const { token, temperatura, device_id, signature } = req.body;

    /* ───────── VALIDACIONES BÁSICAS ───────── */
    if (!token || temperatura === undefined || !device_id) {
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

    /* ───────── VALIDAR SESIÓN ───────── */
    const jobResult = await pool.query(`
      SELECT id_usuario, estado, device_id
      FROM sesiones_medicion
      WHERE token = $1
        AND expires_at > NOW()
    `, [token]);

    if (jobResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Token inválido o expirado"
      });
    }

    const session = jobResult.rows[0];

    /* ───────── VALIDACIÓN DE ESTADO ───────── */
    if (session.estado !== "asignado") {
      return res.status(403).json({
        success: false,
        message: "Sesión no asignada a dispositivo"
      });
    }

    /* ───────── VALIDACIÓN DISPOSITIVO ───────── */
    if (session.device_id !== device_id) {
      return res.status(403).json({
        success: false,
        message: "Dispositivo no autorizado"
      });
    }

    /* ───────── VALIDACIÓN FIRMA (ANTI FAKE ESP) ───────── */
    const expectedSignature = crypto
      .createHmac("sha256", process.env.ESP_SECRET)
      .update(token + temperatura + device_id)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(403).json({
        success: false,
        message: "Firma inválida"
      });
    }

    const id_usuario = session.id_usuario;

    /* ───────── LÍMITE DIARIO ───────── */
    const countResult = await pool.query(`
      SELECT COUNT(*) 
      FROM medidas 
      WHERE id_usuario = $1
        AND DATE(created_at AT TIME ZONE 'America/Bogota') = CURRENT_DATE
    `, [id_usuario]);

    const total = parseInt(countResult.rows[0].count);

    if (total >= 3) {
      return res.status(403).json({
        success: false,
        message: "Límite diario alcanzado"
      });
    }

    /* ───────── GUARDAR MEDICIÓN ───────── */
    await pool.query(`
      INSERT INTO medidas (id_usuario, temperatura, created_at)
      VALUES ($1, $2, NOW() AT TIME ZONE 'America/Bogota')
    `, [id_usuario, temperatura]);

    /* ───────── COMPLETAR JOB ───────── */
    await pool.query(`
      UPDATE sesiones_medicion
      SET estado = 'completado',
          completed_at = NOW() AT TIME ZONE 'America/Bogota'
      WHERE token = $1
    `, [token]);

    /* ───────── ALERTA ───────── */
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
      message: "Medición registrada correctamente"
    });

  } catch (error) {
    console.error("ERROR MEDIDAS DEVICE:", error);
    return res.status(500).json({
      success: false,
      message: "Error en servidor"
    });
  }
});

module.exports = router;