const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { sequelize } = require("./models");

const menuRoutes = require("./routes/menuRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/menu", menuRoutes);

// Start server
const PORT = process.env.PORT || 5000;
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ DB connection error:", err));
