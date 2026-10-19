const buckets = new Map();

// One process only. A second server would keep its own counts.
function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.user?._id || "anon"}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const recent = (buckets.get(key) || []).filter((stamp) => now - stamp < windowMs);

    if (recent.length >= max) {
      return res.status(429).json({
        message: "Too many tries. Wait a moment and try again.",
        code: "rate_limited",
      });
    }

    recent.push(now);
    buckets.set(key, recent);

    if (buckets.size > 5000) {
      for (const [id, stamps] of buckets) {
        if (stamps.every((stamp) => now - stamp >= windowMs)) {
          buckets.delete(id);
        }
      }
    }

    return next();
  };
}

module.exports = rateLimit;
