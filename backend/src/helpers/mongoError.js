function isDuplicateKey(error) {
  return Boolean(error && (error.code === 11000 || error.errorResponse?.code === 11000));
}

module.exports = { isDuplicateKey };
