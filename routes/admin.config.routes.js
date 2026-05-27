const express = require("express");
const router = express.Router();
const pool = require("../db");


/* ==========================
   EMPRESAS
========================== */

/* Listar empresas */

router.get(
    "/admin/empresas",
    async (req, res) => {

        const result = await pool.query(`
SELECT *
FROM empresas
ORDER BY nombre
`);

        res.json({
            success: true,
            data: result.rows
        });

    });


/* Crear empresa */
/* Crear empresa */

router.post(
    "/admin/empresas",
    async (req, res) => {

        const {
            nombre,
            direccion,
            celular,
            correo
        } = req.body;

        await pool.query(`
INSERT INTO empresas
(
nombre,
direccion,
celular,
correo
)
VALUES($1,$2,$3,$4)
`,
            [
                nombre,
                direccion,
                celular,
                correo
            ]);

        res.json({
            success: true
        });

    });

/* Editar empresa */

router.put(
    "/admin/empresas/:id",
    async (req, res) => {

        const id = req.params.id;

        const {
            nombre,
            direccion,
            celular,
            correo
        } = req.body;

        await pool.query(`

UPDATE empresas

SET

nombre=$1,
direccion=$2,
celular=$3,
correo=$4

WHERE id_empresa=$5

`,
            [
                nombre,
                direccion,
                celular,
                correo,
                id
            ]);

        res.json({
            success: true
        });

    });


/* Activar/Inactivar empresa */

router.put(
    "/admin/empresas/:id/estado",
    async (req, res) => {

        const id = req.params.id;

        await pool.query(`
UPDATE empresas
SET activo=NOT activo
WHERE id_empresa=$1
`,
            [id]);

        res.json({
            success: true
        });

    });



/* ==========================
   USUARIOS
========================== */

router.get(
    "/admin/usuarios",
    async (req, res) => {

        const result = await pool.query(`

SELECT
u.id_usuario,
u.nombre,
u.apellido,
u.username,
u.activo,
u.id_rol,
e.nombre empresa

FROM usuarios u

LEFT JOIN empresas e
ON e.id_empresa=u.id_empresa

WHERE u.id_rol != 2

ORDER BY u.nombre

`);

        res.json({
            success: true,
            data: result.rows
        });

    });

/* Detalle usuario */
router.get(
    "/admin/usuarios/:id",

    async (req, res) => {

        const id =
            req.params.id;

        const result =
            await pool.query(`

SELECT

u.*,
t.nombre AS tipo_documento,
e.nombre AS empresa

FROM usuarios u

LEFT JOIN tipos_documento t
ON t.id_tipo_documento=u.id_tipo_documento

LEFT JOIN empresas e
ON e.id_empresa=u.id_empresa

WHERE
u.id_usuario=$1
AND u.id_rol!=2

`, [id]);

        res.json({

            success: true,

            data:
                result.rows[0]

        });

    });

/* editar usuario */

router.put(
    "/admin/usuarios/:id",

    async (req, res) => {

        const id =
            req.params.id;

        const {

            nombre,
            apellido,
            id_tipo_documento,
            numero_documento,
            direccion,
            celular,
            id_empresa

        } = req.body;

        await pool.query(`

UPDATE usuarios

SET

nombre=$1,
apellido=$2,
id_tipo_documento=$3,
numero_documento=$4,
direccion=$5,
celular=$6,
id_empresa=$7

WHERE
id_usuario=$8
AND id_rol!=2

`, [

            nombre,
            apellido,
            id_tipo_documento,
            numero_documento,
            direccion,
            celular,
            id_empresa,
            id

        ]);

        res.json({
            success: true
        });

    });

/* TODAS LAS EMPRESAS (admin) */
router.get("/admin/empresas/catalogo", async (req, res) => {

    try {

        const result = await pool.query(`
      SELECT
        id_empresa AS id,
        nombre,
        activo
      FROM empresas
      ORDER BY nombre
    `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Error cargando empresas"
        });

    }

});

/* Activar/Inactivar usuario */

router.put(
    "/admin/usuarios/:id/estado",
    async (req, res) => {

        const id = req.params.id;

        await pool.query(`
UPDATE usuarios
SET activo=NOT activo
WHERE id_usuario=$1
`,
            [id]
        );

        res.json({
            success: true
        });

    });


module.exports = router;