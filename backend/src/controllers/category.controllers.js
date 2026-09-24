const CATEGORIES = require("../constants/categories");

const listCategories = (req, res) => {
  return res.status(200).json({ categories: CATEGORIES });
};

module.exports = { listCategories };
