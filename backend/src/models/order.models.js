const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 120,
    },
    unitPriceKobo: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    totalKobo: {
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
      enum: ["pending_payment", "paid", "paid_unfulfilled", "failed"],
      default: "pending_payment",
    },
    paymentMethod: {
      type: String,
      enum: ["paystack", "wallet"],
      required: true,
    },
    paymentReference: {
      type: String,
      default: null,
    },
    // Scoped per user. Cleared when a Paystack start fails so the shopper can try again.
    idempotencyKey: {
      type: String,
      maxlength: 80,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

orderSchema.index({ userId: 1, _id: -1 });
orderSchema.index(
  { userId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
