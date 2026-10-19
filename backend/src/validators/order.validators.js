const Joi = require("joi");

const orderIdParamSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
});

module.exports = { orderIdParamSchema };
