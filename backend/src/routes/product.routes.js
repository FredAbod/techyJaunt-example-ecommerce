const express = require("express");
const router = express.Router();
const { requireAuth, requireAdmin } = require("../middlewares/auth");
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  signProductImage,
  confirmProductImage,
} = require("../controllers/product.controllers");

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", requireAuth, requireAdmin, createProduct);
router.patch("/:id", requireAuth, requireAdmin, updateProduct);
router.delete("/:id", requireAuth, requireAdmin, deleteProduct);
router.post("/:id/image/signature", requireAuth, requireAdmin, signProductImage);
router.post("/:id/image", requireAuth, requireAdmin, confirmProductImage);

module.exports = router;
