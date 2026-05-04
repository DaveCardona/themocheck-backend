const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require("../db");

router.post("/login", async (req, res) => {
  try {
    //  Obtener datos del body
    let { username, password } = req.body;

    //  Validación básica
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Debes ingresar usuario y contraseña"
      });
    }

    //  Normalizar username (minúsculas)
    const usernameInput = username.toLowerCase();

    //  Buscar usuario
    const result = await pool.query(
      `SELECT u.id_usuario, u.username, u.password, u.nombre, u.apellido, r.id_rol, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.id_rol = r.id_rol
       WHERE LOWER(u.username) = $1`,
      [usernameInput]
    );

    //  Usuario no existe
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario o contraseña incorrectos"
      });
    }

    const user = result.rows[0];

    //  Validar contraseña
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Usuario o contraseña incorrectos"
      });
    }

    //  Eliminar password antes de enviar
    delete user.password;

    user.nombre_completo = `${user.nombre} ${user.apellido}`;

    //  Respuesta exitosa
    res.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error("ERROR LOGIN:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor"
    });
  }
});

module.exports = router;