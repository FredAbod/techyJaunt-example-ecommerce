const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// One row per Paystack charge. This is the ticket, not the purse.
// accessCode and authorizationUrl are hidden from normal queries.
const paymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallets",
      default: null,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    purpose: {
      type: String,
      enum: ["wallet_topup", "order"],
      required: true,
    },
    amountKobo: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      enum: ["NGN"],
      default: "NGN",
    },
    status: {
      type: String,
      enum: ["initialized", "success", "failed", "abandoned"],
      default: "initialized",
    },
    email: {
      type: String,
      required: true,
    },
    accessCode: {
      type: String,
      default: null,
      select: false,
    },
    authorizationUrl: {
      type: String,
      default: null,
      select: false,
    },
    channel: {
      type: String,
      default: null,
    },
    feesKobo: {
      type: Number,
      default: 0,
      min: 0,
    },
    gatewayResponse: {
      type: String,
      default: null,
      maxlength: 300,
    },
    failureReason: {
      type: String,
      default: null,
      maxlength: 80,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

paymentSchema.index({ userId: 1, _id: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
