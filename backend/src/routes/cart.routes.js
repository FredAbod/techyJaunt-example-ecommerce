const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  addCartItemSchema,
  updateCartItemSchema,
  cartProductIdParamSchema,
} = require("../validators/cart.validators");
const { getCart, addItem, updateItem, removeItem } = require("../controllers/cart.controllers");

router.get("/", requireAuth, getCart);
router.post("/items", requireAuth, validate(addCartItemSchema), addItem);
router.patch(
  "/items/:productId",
  requireAuth,
  validate(cartProductIdParamSchema, "params"),
  validate(updateCartItemSchema),
  updateItem,
);
router.delete(
  "/items/:productId",
  requireAuth,
  validate(cartProductIdParamSchema, "params"),
  removeItem,
);

module.exports = router;
