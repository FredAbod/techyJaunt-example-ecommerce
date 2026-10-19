const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { listTransactionsSchema } = require("../validators/wallet.validators");
const { createWallet, getWallet, getTransactions } = require("../controllers/wallet.controller");

router.post("/", requireAuth, createWallet);
router.post("/create-wallet", requireAuth, createWallet);
router.get("/", requireAuth, getWallet);
router.get("/get-wallet", requireAuth, getWallet);
router.get(
  "/transactions",
  requireAuth,
  validate(listTransactionsSchema, "query"),
  getTransactions,
);

module.exports = router;
