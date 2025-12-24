/**
 * Temporary Admin Access Key middleware
 *
 * Requires a query parameter: ?key=YOUR_SECRET
 * Compares it to process.env.ADMIN_ACCESS_KEY
 *
 * If missing/invalid: redirects to home (/)
 */

const crypto = require("crypto");

function timingSafeStringEqual(a, b) {
  const aa = String(a ?? "");
  const bb = String(b ?? "");
  const aBuf = Buffer.from(aa);
  const bBuf = Buffer.from(bb);
  // timingSafeEqual throws if lengths differ
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function requireAdminAccessKey(req, res, next) {
  const expected = process.env.ADMIN_ACCESS_KEY;

  // Fail safe: if server is misconfigured, don't allow access
  if (!expected || String(expected).trim() === "") {
    return res.status(500).send("Server misconfigured: ADMIN_ACCESS_KEY not set");
  }

  // Support both ?key=... and ?access=... (compat)
  const provided = req.query?.key ?? req.query?.access;

  // Reject repeated query param usage (?key=a&key=b)
  if (Array.isArray(provided)) {
    return res.redirect(302, "/");
  }

  if (!provided || !timingSafeStringEqual(provided, expected)) {
    return res.redirect(302, "/");
  }

  return next();
}

module.exports = { requireAdminAccessKey };


