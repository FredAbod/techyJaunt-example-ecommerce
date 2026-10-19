const Order = require("../models/order.models");
const AppError = require("../helpers/appError");

async function getOrderForUser(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new AppError("Order not found.", 404, "order_missing");
  return order;
}

module.exports = { getOrderForUser };