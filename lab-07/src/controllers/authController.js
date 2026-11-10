/*
  Starter — src/controllers/authController.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 8 · Session 27 · Practice (AF2) · Pair work

  Paste this file into src/controllers/authController.js.

  Two handlers: register (sign-up) and login. Factory takes the usersModel so
  it is easy to test. Do NOT rename createAuthController, register, or login.

  bcryptjs provides the bcrypt hash/compare API without a native compiler.
  Reject passwords longer than 72 UTF-8 bytes to avoid silent truncation.
*/

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function createAuthController({ usersModel }) {
  return {
    async register(req, res, next) {
      // TODO: read { email, password } from req.body. Basic validation:
      //   email must be a non-empty string and password 8..72 UTF-8 bytes,
      //   else 400.
      // TODO: reject a duplicate email with 409 (usersModel.findByEmail).
      // TODO: hash the password: bcrypt.hash(password, 10)  (cost >= 10).
      // TODO: usersModel.create({ email, passwordHash }); respond 201 with
      //   { id, email } ONLY — never return the hash.
      // Wrap the body in try/catch and forward errors with next(err).
    },

    async login(req, res, next) {
      // TODO: find the user by email; if none -> 401 "Invalid credentials".
      // TODO: bcrypt.compare(password, user.password_hash); if false -> 401.
      // TODO: sign a token:
      //   jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET,
      //     { expiresIn: "1h" })
      //   respond 200 with { token }.
      // Wrap the body in try/catch and forward errors with next(err).
    },
  };
}

module.exports = { createAuthController };
