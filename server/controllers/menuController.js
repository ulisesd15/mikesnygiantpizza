const { MenuItem } = require("../models");

exports.getMenu = async (req, res) => {
  try {
    const menu = await MenuItem.findAll();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu" });
  }
};
