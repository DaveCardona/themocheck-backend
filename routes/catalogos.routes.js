const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ── TIPOS DE DOCUMENTO ── */
router.get("/tipos-documento", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_tipo_documento AS id, nombre FROM tipos_documento"
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo tipos de documento"
    });
  }
});

/* ── EMPRESAS ── */
router.get("/empresas", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_empresa AS id, nombre FROM empresas"
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo empresas"
    });
  }
});

module.exports = router;