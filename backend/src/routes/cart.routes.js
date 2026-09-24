const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth");
const { getCart, addItem, updateItem, removeItem } = require("../controllers/cart.controllers");

router.get("/", requireAuth, getCart);
router.post("/items", requireAuth, addItem);
router.patch("/items/:productId", requireAuth, updateItem);
router.delete("/items/:productId", requireAuth, removeItem);

module.exports = router;
