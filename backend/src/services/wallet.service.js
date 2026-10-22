const Wallet = require("../models/wallets.models");
const Counter = require("../models/counter.models");
const TransactionHistory = require("../models/transactionHistory");
const AppError = require("../helpers/appError");
const { isDuplicateKey } = require("../helpers/mongoError");

const FIRST_ACCOUNT_NUMBER = 1_000_000_000;
const LAST_ACCOUNT_NUMBER = 9_999_999_999;

async function nextAccountNumber() {
  const counter = await Counter.findOneAndUpdate(
    { _id: "walletAccount" },
    [{ $set: { seq: { $add: [{ $ifNull: ["$seq", FIRST_ACCOUNT_NUMBER - 1] }, 1] } } }],
    { upsert: true, new: true },
  );

  if (!Number.isSafeInteger(counter.seq) || counter.seq > LAST_ACCOUNT_NUMBER) {
    throw new AppError("No account numbers left.", 500);
  }

  return String(counter.seq);
}

async function ensureWallet(userId) {
  const existing = await Wallet.findOne({ userId });
  if (existing) return existing;

  try {
    return await Wallet.create({
      userId,
      accountNumber: await nextAccountNumber(),
      balanceKobo: 0,
      currency: "NGN",
      status: "active",
    });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const winner = await Wallet.findOne({ userId });
    if (winner) return winner;
    throw error;
  }
}

async function listTransactions(userId, { limit = 20, cursor } = {}) {
  const filter = { userId };
  if (cursor) filter._id = { $lt: cursor };

  const rows = await TransactionHistory.find(filter).sort({ _id: -1 }).limit(limit + 1);
  const hasMore = rows.length > limit;
  const transactions = hasMore ? rows.slice(0, limit) : rows;
  const last = transactions[transactions.length - 1];

  return {
    transactions,
    nextCursor: hasMore && last ? String(last._id) : null,
  };
}

// The only place a purse balance is allowed to change.
async function applyBalanceChange(session, {
  userId,
  amountKobo,
  direction,
  reference,
  provider,
  purpose,
  description,
  paymentId = null,
  orderId = null,
}) {
  if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
    throw new AppError("Amount is not valid.", 400, "invalid_amount");
  }

  const already = await TransactionHistory.findOne({ reference }).session(session);
  if (already) {
    const wallet = await Wallet.findOne({ userId }).session(session);
    return { wallet, entry: already, duplicate: true };
  }

  const filter = { userId };
  const delta = direction === "credit" ? amountKobo : -amountKobo;
  if (direction === "debit") {
    filter.status = "active";
    filter.balanceKobo = { $gte: amountKobo };
  }

  const wallet = await Wallet.findOneAndUpdate(
    filter,
    { $inc: { balanceKobo: delta } },
    { new: true, session },
  );

  if (!wallet) {
    const exists = await Wallet.findOne({ userId }).session(session);
    if (!exists) throw new AppError("Wallet not found.", 404, "wallet_missing");
    if (exists.status !== "active") {
      throw new AppError("This wallet is frozen.", 403, "wallet_frozen");
    }
    throw new AppError("Your wallet does not have enough money.", 400, "insufficient_funds");
  }

  if (!Number.isInteger(wallet.balanceKobo)) {
    throw new AppError("Wallet balance became invalid.", 500);
  }

  const balanceAfterKobo = wallet.balanceKobo;
  const balanceBeforeKobo = balanceAfterKobo - delta;

  const [entry] = await TransactionHistory.create(
    [
      {
        userId,
        walletId: wallet._id,
        paymentId,
        orderId,
        reference,
        provider,
        type: direction,
        purpose,
        amountKobo,
        balanceBeforeKobo,
        balanceAfterKobo,
        currency: "NGN",
        status: "completed",
        description,
      },
    ],
    { session },
  );

  return { wallet, entry, duplicate: false };
}

module.exports = {
  ensureWallet,
  listTransactions,
  applyBalanceChange,
};
