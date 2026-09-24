const mongoose = require("mongoose");

const isObjectId = (id) =>
  typeof id === "string" &&
  mongoose.Types.ObjectId.isValid(id) &&
  id.length === 24;

const isNonNegativeInteger = (value) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const isPositiveInteger = (value) =>
  typeof value === "number" && Number.isInteger(value) && value >= 1;

module.exports = { isObjectId, isNonNegativeInteger, isPositiveInteger };
