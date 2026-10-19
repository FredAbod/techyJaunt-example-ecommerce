const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// A line is written only when the purse balance actually changes.
// Lines are not edited. A correction is a new line.
const transactionHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallets",
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
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
    provider: {
      type: String,
      enum: ["paystack", "wallet"],
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    purpose: {
      type: String,
      enum: ["topup", "purchase"],
      required: true,
    },
    amountKobo: {
      type: Number,
      required: true,
      min: 1,
    },
    balanceBeforeKobo: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfterKobo: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["NGN"],
      default: "NGN",
    },
    status: {
      type: String,
      enum: ["completed"],
      default: "completed",
    },
    description: {
      type: String,
      required: true,
      maxlength: 200,
    },
  },
  { timestamps: true, versionKey: false },
);

transactionHistorySchema.index({ userId: 1, _id: -1 });

const TransactionHistory = mongoose.model("TransactionHistory", transactionHistorySchema);

module.exports = TransactionHistory;
