const jwt = require("jsonwebtoken");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;

  // Secure default: require explicit secret in production.
  const isProd = (process.env.NODE_ENV || "").toLowerCase() === "production";
  if (isProd) {
    throw Object.assign(new Error("JWT_SECRET is required in production"), { status: 500 });
  }

  // Dev fallback (still non-empty to avoid crashes).
  return "dev-insecure-jwt-secret-change-me";
}

function signAdminToken(admin) {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || "24h";
  return jwt.sign(
    {
      sub: String(admin.id),
      role: "admin",
      email: admin.email,
      name: admin.name,
    },
    secret,
    { expiresIn }
  );
}

function verifyToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

module.exports = {
  signAdminToken,
  verifyToken,
};
