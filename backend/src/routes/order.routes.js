const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { orderIdParamSchema } = require("../validators/order.validators");
const { getOrder } = require("../controllers/order.controller");

router.get("/:orderId", requireAuth, validate(orderIdParamSchema, "params"), getOrder);

module.exports = router;
