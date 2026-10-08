const express = require("express");
const router = express.Router();
const { requireAuth, requireAdmin } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  confirmProductImageSchema,
} = require("../validators/product.validators");
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  signProductImage,
  confirmProductImage,
} = require("../controllers/product.controllers");

router.get("/", validate(listProductsQuerySchema, "query"), listProducts);
router.get("/:id", validate(productIdParamSchema, "params"), getProduct);
router.post("/", requireAuth, requireAdmin, validate(createProductSchema), createProduct);
router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(productIdParamSchema, "params"),
  validate(updateProductSchema),
  updateProduct,
);
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(productIdParamSchema, "params"),
  deleteProduct,
);
router.post(
  "/:id/image/signature",
  requireAuth,
  requireAdmin,
  validate(productIdParamSchema, "params"),
  signProductImage,
);
router.post(
  "/:id/image",
  requireAuth,
  requireAdmin,
  validate(productIdParamSchema, "params"),
  validate(confirmProductImageSchema),
  confirmProductImage,
);

module.exports = router;
