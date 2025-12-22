const bcrypt = require("bcryptjs");

const DEFAULT_SALT_ROUNDS = 12;

async function hashPassword(password) {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || DEFAULT_SALT_ROUNDS);
  return bcrypt.hash(password, saltRounds);
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  hashPassword,
  comparePassword,
};
