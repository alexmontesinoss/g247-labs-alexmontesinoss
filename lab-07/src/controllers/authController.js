/*
  src/controllers/authController.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 8 · Session 27 · Practice (AF2)

  Two handlers: register (sign-up) and login. Factory takes the usersModel so
  it is easy to test. Do NOT rename createAuthController, register, or login.

  bcryptjs provides the bcrypt hash/compare API without a native compiler.
  Reject passwords longer than 72 UTF-8 bytes to avoid silent truncation.
*/

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// bcrypt solo mira los primeros 72 bytes de la contrasena. Si alguien pone una
// mas larga y yo la cortase por las buenas, el usuario creeria que tiene una
// contrasena larguisima cuando en realidad solo cuentan los primeros 72 bytes.
// Prefiero rechazarla y decirlo, que es lo que pide el enunciado.
const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72;

// Cuento BYTES y no letras: una letra con tilde o un emoji ocupan varios bytes,
// y el limite de bcrypt esta en bytes, no en caracteres.
function bytesDe(texto) {
  return Buffer.byteLength(texto, "utf8");
}

function correoInvalido(email) {
  return typeof email !== "string" || email.trim() === "";
}

function contrasenaInvalida(password) {
  if (typeof password !== "string") return true;
  if (password.length < PASSWORD_MIN) return true;
  if (bytesDe(password) > PASSWORD_MAX_BYTES) return true;
  return false;
}

function createAuthController({ usersModel }) {
  return {
    // POST /auth/register
    async register(req, res, next) {
      try {
        const { email, password } = req.body || {};

        if (correoInvalido(email) || contrasenaInvalida(password)) {
          return res.status(400).json({
            error:
              "Hace falta un correo y una contrasena de entre 8 caracteres y 72 bytes.",
          });
        }

        // 409 y no 400: la peticion esta bien escrita, lo que pasa es que
        // choca con algo que ya existe. Conflicto, no error de formato.
        const yaExiste = await usersModel.findByEmail(email);
        if (yaExiste) {
          return res.status(409).json({ error: "Ese correo ya esta registrado" });
        }

        // AQUI esta lo importante del laboratorio: la contrasena no se guarda.
        // Se guarda su hash. El 10 es el coste: cuantas vueltas da bcrypt.
        // Cuanto mas alto, mas lento de calcular y mas caro de atacar por
        // fuerza bruta. El enunciado pide 10 como minimo.
        const passwordHash = await bcrypt.hash(password, 10);

        const creado = await usersModel.create({ email, passwordHash });

        // Solo id y correo. El hash no sale de aqui ni por error.
        return res.status(201).json({ id: creado.id, email: creado.email });
      } catch (err) {
        next(err);
      }
    },

    // POST /auth/login
    async login(req, res, next) {
      try {
        const { email, password } = req.body || {};

        if (correoInvalido(email) || typeof password !== "string") {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const usuario = await usersModel.findByEmail(email);

        // Mismo 401 y mismo mensaje tanto si el correo no existe como si la
        // contrasena esta mal. Si dijera "ese correo no existe", cualquiera
        // podria ir probando correos para averiguar quien esta registrado.
        if (!usuario) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // bcrypt.compare vuelve a cifrar lo que ha escrito el usuario y lo
        // compara con el hash guardado. No se puede hacer con === porque el
        // hash no se puede deshacer: de un hash no se saca la contrasena.
        const coincide = await bcrypt.compare(password, usuario.password_hash);
        if (!coincide) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // El token lleva dentro quien eres (sub) y que papel tienes (role),
        // va firmado con JWT_SECRET y caduca en una hora.
        const token = jwt.sign(
          { sub: usuario.id, role: usuario.role },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        return res.status(200).json({ token });
      } catch (err) {
        next(err);
      }
    },
  };
}

module.exports = { createAuthController };
