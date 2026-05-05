const express = require("express");
const router = express.Router();
const pool = require("../db");
const crypto = require("crypto");

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

module.exports = router;