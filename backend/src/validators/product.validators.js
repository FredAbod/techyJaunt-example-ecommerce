const Joi = require("joi");
const CATEGORIES = require("../constants/categories");

const objectId = Joi.string().hex().length(24);

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  description: Joi.string().trim().min(1).max(2000).required(),
  price: Joi.number().integer().min(0).required(),
  stock: Joi.number().integer().min(0).required(),
  category: Joi.string()
    .valid(...CATEGORIES)
    .required(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120),
  description: Joi.string().trim().min(1).max(2000),
  price: Joi.number().integer().min(0),
  stock: Joi.number().integer().min(0),
  category: Joi.string().valid(...CATEGORIES),
})
  .min(1)
  .messages({
    "object.min": "No valid fields to update",
  });

const listProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  category: Joi.string().valid(...CATEGORIES),
});

const productIdParamSchema = Joi.object({
  id: objectId.required(),
});

const confirmProductImageSchema = Joi.object({
  publicId: Joi.string().trim().min(1).max(200).required(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  confirmProductImageSchema,
};
