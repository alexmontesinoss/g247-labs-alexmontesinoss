/*
  src/controllers/authController.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Registro, inicio de sesion y "quien soy".

  Factoria otra vez: recibe el modelo de usuarios en vez de importarlo. Asi
  las pruebas pueden darle un modelo falso sin levantar PostgreSQL.
*/

const bcrypt = require("bcryptjs");
const { firmarToken } = require("../middleware/auth");
const { usuarioToDTO } = require("../mappers/partidoMapper");

/*
  El coste del hash. Cada punto mas DUPLICA el tiempo que se tarda, y eso es
  justo lo que se busca: que probar contrasenas a lo bruto salga caro. 10 es
  el minimo razonable hoy; con mas, el login empieza a notarse lento.
*/
const COSTE = 10;

function createAuthController(usersModel) {
  return {
    async register(req, res, next) {
      try {
        const { email, password } = req.body;

        // Comprobacion amable antes de intentar insertar. No basta con ella:
        // entre este SELECT y el INSERT podria colarse otro registro con el
        // mismo correo. La garantia de verdad es el UNIQUE de la tabla, y
        // por eso abajo tambien se captura el error 23505.
        const existente = await usersModel.findByEmail(email);
        if (existente) {
          return res.status(409).json({ error: "Ya hay una cuenta con ese correo." });
        }

        /*
          Nunca se guarda la contrasena. Se guarda su hash, que es un
          resultado del que NO se puede volver atras. bcrypt ademas mete una
          "sal" aleatoria dentro del propio hash, asi que dos personas con la
          misma contrasena tienen hashes distintos y no se puede ver de un
          vistazo quien la repite.
        */
        const passwordHash = await bcrypt.hash(password, COSTE);

        const usuario = await usersModel.create({ email, passwordHash });

        // 201 y no 200: se ha creado un recurso nuevo.
        res.status(201).json({
          user: usuarioToDTO(usuario),
          token: firmarToken(usuario),
        });
      } catch (err) {
        // 23505 es el codigo de PostgreSQL para "has roto un UNIQUE".
        if (err.code === "23505") {
          return res.status(409).json({ error: "Ya hay una cuenta con ese correo." });
        }
        next(err);
      }
    },

    async login(req, res, next) {
      try {
        const { email, password } = req.body;

        const usuario = await usersModel.findByEmail(email);

        /*
          MISMA respuesta para "ese correo no existe" y para "la contrasena
          no es esa". Si se distinguieran, cualquiera podria ir probando
          correos y averiguar quien tiene cuenta aqui sin saber ni una
          contrasena. Se llama enumeracion de usuarios.
        */
        const malas = () => res.status(401).json({ error: "Correo o contrasena incorrectos." });

        if (!usuario) return malas();

        /*
          bcrypt.compare y nunca un ===. El hash guardado lleva la sal
          dentro, asi que volver a cifrar la contrasena daria un texto
          distinto cada vez. compare extrae la sal del hash, cifra con ella
          lo que acaba de llegar y compara los dos resultados.
        */
        const coincide = await bcrypt.compare(password, usuario.password_hash);
        if (!coincide) return malas();

        res.json({
          user: usuarioToDTO(usuario),
          token: firmarToken(usuario),
        });
      } catch (err) {
        next(err);
      }
    },

    /*
      Para que el cliente sepa quien es sin tener que abrir el token. Se
      relee de la base de datos en vez de devolver lo que diga el token:
      el token se firmo hace un rato y el usuario podria haber cambiado o
      haber sido borrado desde entonces.
    */
    async me(req, res, next) {
      try {
        const usuario = await usersModel.findById(req.user.sub);
        if (!usuario) {
          return res.status(401).json({ error: "La cuenta ya no existe." });
        }
        res.json(usuarioToDTO(usuario));
      } catch (err) {
        next(err);
      }
    },
  };
}

module.exports = { createAuthController, COSTE };
