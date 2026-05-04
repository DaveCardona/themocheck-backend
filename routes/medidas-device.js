const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ───────────── MEDIDAS DESDE ESP32 ───────────── */

router.post("/medidas-device", async (req, res) => {
  try {
    const { token, temperatura, device_id } = req.body;

    /* ─── VALIDACIONES BÁSICAS ─── */
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

    /* ─── VALIDAR SESIÓN ─── */
    const sesion = await pool.query(`
      SELECT id_usuario
      FROM sesiones_medicion
      WHERE token = $1
      AND expires_at > NOW()
    `, [token]);

    if (sesion.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Token inválido o expirado"
      });
    }

    const id_usuario = sesion.rows[0].id_usuario;

    /* ─── VALIDAR LÍMITE DIARIO ─── */
    const count = await pool.query(`
      SELECT COUNT(*) 
      FROM medidas 
      WHERE id_usuario = $1 
      AND DATE(fecha) = CURRENT_DATE
    `, [id_usuario]);

    const total = parseInt(count.rows[0].count);

    if (total >= 3) {
      return res.status(403).json({
        success: false,
        message: "Límite de 3 mediciones alcanzado"
      });
    }

    /* ─── GUARDAR MEDIDA ─── */
    await pool.query(`
      INSERT INTO medidas (id_usuario, temperatura)
      VALUES ($1, $2)
    `, [id_usuario, temperatura]);

    /* ─── ALERTA ─── */
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
      message: "Medición registrada desde ESP32"
    });

  } catch (error) {
    console.error("ERROR MEDIDAS DEVICE:", error);
    res.status(500).json({
      success: false,
      message: "Error en servidor"
    });
  }
});

module.exports = router;