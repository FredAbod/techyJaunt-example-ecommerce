const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const rateLimit = require("../middlewares/rateLimit");
const { topUpSchema, checkoutSchema, verifySchema } = require("../validators/payment.validators");
const { topUp, checkout, verify, webhook } = require("../controllers/payment.controller");

const payLimit = rateLimit({ windowMs: 60_000, max: 8 });

router.post("/webhook", webhook);
router.post("/top-up", requireAuth, payLimit, validate(topUpSchema), topUp);
router.post("/checkout", requireAuth, payLimit, validate(checkoutSchema), checkout);
router.post("/verify", requireAuth, rateLimit({ windowMs: 60_000, max: 30 }), validate(verifySchema), verify);

module.exports = router;
