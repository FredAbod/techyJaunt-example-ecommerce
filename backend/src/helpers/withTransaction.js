const mongoose = require("mongoose");
const AppError = require("./appError");

async function withDbTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    const message = String(error.message || "");
    if (
      message.includes("Transaction numbers are only allowed") ||
      message.includes("replica set")
    ) {
      throw new AppError(
        "Money moves need a MongoDB replica set so a payment can finish all at once or not at all.",
        503,
        "replica_set_required",
      );
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

module.exports = withDbTransaction;
