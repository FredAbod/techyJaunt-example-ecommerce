const mongoose = require("mongoose");

// One row per sequence. _id is the sequence name, not an ObjectId.
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String },
    seq: { type: Number, required: true },
  },
  { versionKey: false },
);

const Counter = mongoose.model("Counter", counterSchema);

module.exports = Counter;
