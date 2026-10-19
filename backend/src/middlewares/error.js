function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) {
    console.error(error);
  }

  return res.status(status).json({
    message: error.isOperational ? error.message : "Internal server error",
    ...(error.code ? { code: error.code } : {}),
  });
}

module.exports = errorHandler;
