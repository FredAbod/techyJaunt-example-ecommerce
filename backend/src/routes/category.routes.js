const express = require("express");
const router = express.Router();
const { listCategories } = require("../controllers/category.controllers");

router.get("/", listCategories);

module.exports = router;
