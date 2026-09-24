const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const CATEGORIES = require("../constants/categories");

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 120,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

productSchema.index({ category: 1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
