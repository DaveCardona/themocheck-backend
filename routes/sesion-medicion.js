const express = require("express");
const router = express.Router();
const pool = require("../db");
const crypto = require("crypto");

/* ─────────────────────────────────────────────
   CREAR SESIÓN DE MEDICIÓN
───────────────────────────────────────────── */

router.post("/sesion-medicion", async (req, res) => {
  try {
    const { id_usuario } = req.body;

    if (!id_usuario) {
      return res.status(400).json({
        success: false,
        message: "id_usuario requerido"
      });
    }

    const token = crypto.randomUUID();

    await pool.query(`
      INSERT INTO sesiones_medicion (
        token,
        id_usuario,
        estado,
        expires_at
      )
      VALUES ($1, $2, 'pendiente', NOW() + INTERVAL '5 minutes')
    `, [token, id_usuario]);

    return res.json({
      success: true,
      token
    });

  } catch (error) {
    console.error("ERROR SESION MEDICION:", error);
    return res.status(500).json({
      success: false,
      message: "Error creando sesión de medición"
    });
  }
});


/* ─────────────────────────────────────────────
   CONSULTAR ESTADO DE MEDICIÓN (POLLING)
───────────────────────────────────────────── */

router.get("/medicion-estado/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(`
      SELECT estado, completed_at
      FROM sesiones_medicion
      WHERE token = $1
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Token no encontrado"
      });
    }

    const session = result.rows[0];

    // Aún no termina
    if (session.estado !== "completado") {
      return res.json({
        success: true,
        estado: session.estado
      });
    }

    // Obtener última medición del usuario
    const medida = await pool.query(`
      SELECT temperatura
      FROM medidas
      WHERE id_usuario = (
        SELECT id_usuario FROM sesiones_medicion WHERE token = $1
      )
      ORDER BY created_at DESC
      LIMIT 1
    `, [token]);

    //  evitar crash si no hay datos
    if (medida.rows.length === 0) {
      return res.json({
        success: true,
        estado: "completado",
        temperatura: null
      });
    }

    return res.json({
      success: true,
      estado: "completado",
      temperatura: medida.rows[0].temperatura
    });

  } catch (error) {
    console.error("ERROR MEDICION ESTADO:", error);
    return res.status(500).json({
      success: false
    });
  }
});

module.exports = router;