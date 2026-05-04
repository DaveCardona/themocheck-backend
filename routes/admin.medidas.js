const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/admin/medidas", async (req, res) => {
    try {
        const { estado, empresa, fecha, search } = req.query;

        let condiciones = [];
        let valores = [];
        let i = 1;

        // 🔹 Filtro por estado
        if (estado && estado !== "todos") {
            if (estado === "fiebre") {
                condiciones.push(`m.temperatura >= 37.5`);
            } else if (estado === "normal") {
                condiciones.push(`m.temperatura < 37.5`);
            }
        }

        // 🔹 Filtro por empresa (ahora desde tabla empresas)
        if (empresa) {
            condiciones.push(`LOWER(e.nombre) LIKE $${i++}`);
            valores.push(`%${empresa.toLowerCase()}%`);
        }

        // 🔹 Filtro por fecha
        if (fecha) {
            condiciones.push(`DATE(m.fecha) = $${i++}`);
            valores.push(fecha);
        }

        // 🔹 Búsqueda por nombre
        if (search) {
            condiciones.push(`LOWER(u.nombre || ' ' || u.apellido) LIKE $${i++}`);
            valores.push(`%${search.toLowerCase()}%`);
        }

        const where = condiciones.length
            ? `WHERE ${condiciones.join(" AND ")}`
            : "";

        const query = `
      SELECT 
        m.id_medida,
        u.nombre || ' ' || u.apellido AS paciente,
        e.nombre AS empresa,
        m.temperatura::float AS temperatura,
        m.fecha
      FROM medidas m
      JOIN usuarios u ON u.id_usuario = m.id_usuario
      LEFT JOIN empresas e ON e.id_empresa = u.id_empresa
      ${where}
      ORDER BY m.fecha DESC
    `;

        const result = await pool.query(query, valores);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error("ERROR ADMIN MEDIDAS:", error);

        res.status(500).json({
            success: false,
            message: "Error obteniendo medidas"
        });
    }
});

router.get("/admin/medidas/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
      SELECT 
        m.id_medida,
        m.temperatura::float AS temperatura,
        m.fecha,

        u.nombre,
        u.apellido,
        u.celular,
        u.direccion,

        e.nombre AS empresa

      FROM medidas m
      JOIN usuarios u ON u.id_usuario = m.id_usuario
      LEFT JOIN empresas e ON e.id_empresa = u.id_empresa
      WHERE m.id_medida = $1
    `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Medida no encontrada"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("ERROR DETALLE:", error);

        res.status(500).json({
            success: false,
            message: "Error obteniendo detalle"
        });
    }
});

module.exports = router;