const Joi = require("joi");

const listTransactionsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(20),
  cursor: Joi.string().hex().length(24),
});

module.exports = { listTransactionsSchema };
