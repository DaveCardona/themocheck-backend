const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require("../db");

router.post("/register", async (req, res) => {
  const {
    nombre,
    apellido,
    username,
    password,
    id_tipo_documento,
    numero_documento,
    celular,
    direccion,
    id_empresa
  } = req.body;

  try {
    //  Convertir a número 
    const tipoDocInt = parseInt(id_tipo_documento);
    const empresaInt = parseInt(id_empresa);

    //  Validaciones de integridad
    if (isNaN(tipoDocInt)) {
      return res.json({
        success: false,
        message: "Selecciona un tipo de documento válido"
      });
    }

    if (isNaN(empresaInt)) {
      return res.json({
        success: false,
        message: "Selecciona una empresa válida"
      });
    }

    //  Validar usuario existente
    const userExist = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE username = $1",
      [username]
    );

    if (userExist.rows.length > 0) {
      return res.json({
        success: false,
        message: "El nombre de usuario ya existe, intenta con otro"
      });
    }

    //  Validar documento (tipo + número)
    const docExist = await pool.query(
      `SELECT id_usuario 
       FROM usuarios 
       WHERE numero_documento = $1 
       AND id_tipo_documento = $2`,
      [numero_documento, tipoDocInt]
    );

    if (docExist.rows.length > 0) {
      return res.json({
        success: false,
        message: "El documento ya está registrado con ese tipo"
      });
    }

    //  Hash contraseña
    const hashedPass = await bcrypt.hash(password, 10);

    //  Insertar usuario
    await pool.query(`
      INSERT INTO usuarios 
      (nombre, apellido, username, password, id_tipo_documento, numero_documento, celular, direccion, id_empresa, id_rol)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `, [
      nombre,
      apellido,
      username,
      hashedPass,
      tipoDocInt,
      numero_documento,
      celular,
      direccion,
      empresaInt,
      1 // SIEMPRE SE CREA COMO PACIENTE
    ]);

    res.json({
      success: true,
      message: "Usuario creado correctamente"
    });

  } catch (error) {
    console.error("ERROR REGISTER:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor"
    });
  }
});

module.exports = router;