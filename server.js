require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Conexión DB
require("./db");

// Rutas
const registerRoutes = require("./routes/register");
const loginRoutes = require("./routes/login");
const catalogosRoutes = require("./routes/catalogos.routes");
const medidasRoutes = require("./routes/medidas");
const sesionMedicionRoutes = require("./routes/sesion-medicion");
const medidasDeviceRoutes = require("./routes/medidas-device");
const adminRoutes = require("./routes/admin.routes");
const adminMedidasRoutes = require("./routes/admin.medidas");
const deviceRoutes = require("./routes/device");
const adminConfigRoutes= require("./routes/admin.config.routes");



// Montaje de rutas
app.use("/", registerRoutes);
app.use("/", loginRoutes);
app.use("/", catalogosRoutes);
app.use("/", sesionMedicionRoutes);

app.use("/", medidasRoutes); //web
app.use("/", medidasDeviceRoutes); //ESP32
app.use("/", adminRoutes);
app.use("/", adminMedidasRoutes);
app.use("/",adminConfigRoutes);

app.use("/", deviceRoutes);

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});