const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const walletsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Whole kobo only. ₦1 is 100. Same unit as Product.price.
    balanceKobo: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["NGN"],
      default: "NGN",
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["active", "frozen"],
      default: "active",
    },
  },
  { timestamps: true, versionKey: false },
);

const Wallets = mongoose.model("Wallets", walletsSchema);

module.exports = Wallets;
