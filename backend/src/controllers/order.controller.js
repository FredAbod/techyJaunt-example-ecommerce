const asyncHandler = require("../helpers/asyncHandler");
const { getOrderForUser } = require("../services/order.service");
const { toPublicOrder } = require("../helpers/present");

const getOrder = asyncHandler(async (req, res) => {
  const order = await getOrderForUser(req.user._id, req.params.orderId);
  return res.status(200).json({ order: toPublicOrder(order) });
});

module.exports = { getOrder };
