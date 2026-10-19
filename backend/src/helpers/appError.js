class AppError extends Error {
  constructor(message, status = 500, code = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.isOperational = true;
  }
}

module.exports = AppError;
