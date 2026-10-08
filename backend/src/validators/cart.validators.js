const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const addCartItemSchema = Joi.object({
  productId: objectId.required(),
  quantity: Joi.number().integer().min(1).required(),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

const cartProductIdParamSchema = Joi.object({
  productId: objectId.required(),
});

module.exports = {
  addCartItemSchema,
  updateCartItemSchema,
  cartProductIdParamSchema,
};
