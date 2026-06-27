const express = require("express");
const router = express.Router();
const taxonomy = require("../data/taxonomy.json");

// GET /taxonomy - Full taxonomy tree
router.get("/", (req, res) => {
  res.json({ success: true, data: taxonomy });
});

// GET /taxonomy/themes - List of themes (id + name only)
router.get("/themes", (req, res) => {
  const themes = taxonomy.themes.map(({ id, name }) => ({ id, name }));
  res.json({ success: true, data: themes });
});

// GET /taxonomy/categories?themeId=1
router.get("/categories", (req, res) => {
  const { themeId } = req.query;
  if (!themeId) return res.status(400).json({ success: false, message: "themeId is required" });
  const theme = taxonomy.themes.find(t => t.id === Number(themeId));
  if (!theme) return res.status(404).json({ success: false, message: "Theme not found" });
  const categories = theme.categories.map(c => c.name);
  res.json({ success: true, data: categories });
});

// GET /taxonomy/subcategories?themeId=1&category=Education
router.get("/subcategories", (req, res) => {
  const { themeId, category } = req.query;
  if (!themeId || !category) return res.status(400).json({ success: false, message: "themeId and category are required" });
  const theme = taxonomy.themes.find(t => t.id === Number(themeId));
  if (!theme) return res.status(404).json({ success: false, message: "Theme not found" });
  const cat = theme.categories.find(c => c.name === category);
  if (!cat) return res.status(404).json({ success: false, message: "Category not found" });
  const subCategories = cat.subCategories.map(sc => sc.name);
  res.json({ success: true, data: subCategories });
});

// GET /taxonomy/activities?themeId=1&category=Education&subCategory=Primary Education
router.get("/activities", (req, res) => {
  const { themeId, category, subCategory } = req.query;
  if (!themeId || !category || !subCategory)
    return res.status(400).json({ success: false, message: "themeId, category, and subCategory are required" });
  const theme = taxonomy.themes.find(t => t.id === Number(themeId));
  if (!theme) return res.status(404).json({ success: false, message: "Theme not found" });
  const cat = theme.categories.find(c => c.name === category);
  if (!cat) return res.status(404).json({ success: false, message: "Category not found" });
  const sc = cat.subCategories.find(s => s.name === subCategory);
  if (!sc) return res.status(404).json({ success: false, message: "Sub-category not found" });
  res.json({ success: true, data: sc.activities });
});

module.exports = router;
