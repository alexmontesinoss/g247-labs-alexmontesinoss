/*
  exercises.js — Laboratorio 3, segunda parte
  Programacion de Aplicaciones Web (G247) - CUNEF Escuela Politecnica Superior

  Autor: Alejandro Montesinos
  Modalidad: individual

  Se carga desde index.html y desde login.html. Todo el resultado se ve en la
  consola del navegador (F12 -> Console). Aqui no se toca la pagina: eso es
  la sesion siguiente.
*/

// =====================================================================
// 1. FIZZBUZZ
//    Imprime del 1 al n. Los multiplos de 3 salen como "Fizz", los de 5
//    como "Buzz" y los que son de los dos a la vez como "FizzBuzz".
//    El orden de los if importa: la condicion doble va PRIMERA, porque
//    si no, el 15 entraria por la de 3 y nunca llegaria a la doble.
// =====================================================================

function fizzBuzz(n) {
  for (let i = 1; i <= n; i++) {
    if (i % 3 === 0 && i % 5 === 0) {
      console.log("FizzBuzz");
    } else if (i % 3 === 0) {
      console.log("Fizz");
    } else if (i % 5 === 0) {
      console.log("Buzz");
    } else {
      console.log(i);
    }
  }
}

// =====================================================================
// 2. FINDMAX
//    Devuelve el valor mas grande del array, con un bucle y sin Math.max.
//    Con el array vacio devuelve undefined.
//    Empiezo el maximo en el primer elemento, no en 0: si empezase en 0,
//    un array de numeros negativos daria 0, que ni siquiera esta dentro.
// =====================================================================

function findMax(numbers) {
  if (numbers.length === 0) {
    return undefined;
  }

  let max = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] > max) {
      max = numbers[i];
    }
  }
  return max;
}

// =====================================================================
// 3. ISPALINDROME  (esta es la refactorizada a arrow function)
//    Un palindromo se lee igual del derecho y del reves, ignorando
//    mayusculas, espacios y signos de puntuacion.
//    Dos pasos: primero limpio el texto dejando solo letras y numeros,
//    y luego lo comparo con el mismo texto recorrido al reves.
// =====================================================================

const isPalindrome = (str) => {
  const permitidos = "abcdefghijklmnopqrstuvwxyz0123456789";
  const texto = str.toLowerCase();

  // paso 1: quedarme solo con los caracteres permitidos
  let limpio = "";
  for (let i = 0; i < texto.length; i++) {
    if (permitidos.includes(texto[i])) {
      limpio = limpio + texto[i];
    }
  }

  // paso 2: construir el mismo texto al reves, del final al principio
  let alReves = "";
  for (let i = limpio.length - 1; i >= 0; i--) {
    alReves = alReves + limpio[i];
  }

  return limpio === alReves;
};

// =====================================================================
// 4. VALIDACION DEL FORMULARIO DE ACCESO (apartado 5.4)
//    Las tres son funciones puras: solo miran sus parametros, no tocan
//    la pagina y no cambian nada de fuera. Con los mismos argumentos
//    devuelven siempre lo mismo.
//    Esto es solo la validacion del lado del cliente: quien decide de
//    verdad si alguien entra es el servidor, y eso es el bloque II.
// =====================================================================

// Comprueba que el correo tenga la forma basica algo@algo.algo
function validateEmail(email) {
  const posArroba = email.indexOf("@");

  // tiene que haber una arroba y algo delante de ella
  if (posArroba < 1) {
    return false;
  }

  // y solo una: busco otra a partir de la primera
  if (email.indexOf("@", posArroba + 1) !== -1) {
    return false;
  }

  // un correo no lleva espacios
  if (email.includes(" ")) {
    return false;
  }

  // en el dominio tiene que haber un punto, con algo delante y algo detras
  const dominio = email.slice(posArroba + 1);
  const posPunto = dominio.indexOf(".");
  if (posPunto < 1 || posPunto === dominio.length - 1) {
    return false;
  }

  return true;
}

// Minimo 8 caracteres, con al menos una letra y al menos un numero
function validatePassword(password) {
  if (password.length < 8) {
    return false;
  }

  const letras = "abcdefghijklmnopqrstuvwxyz";
  const numeros = "0123456789";

  let tieneLetra = false;
  let tieneNumero = false;

  for (let i = 0; i < password.length; i++) {
    const caracter = password[i].toLowerCase();
    if (letras.includes(caracter)) {
      tieneLetra = true;
    }
    if (numeros.includes(caracter)) {
      tieneNumero = true;
    }
  }

  return tieneLetra && tieneNumero;
}

// Junta las dos anteriores y devuelve { valid, errors }, un mensaje por error
function validateLoginForm(email, password) {
  const errors = [];

  if (!validateEmail(email)) {
    errors.push("El correo no tiene un formato valido.");
  }

  if (!validatePassword(password)) {
    errors.push("La contrasena necesita 8 caracteres como minimo, con al menos una letra y un numero.");
  }

  return { valid: errors.length === 0, errors: errors };
}

// =====================================================================
// 5. PRUEBAS (apartado 5.3)
//    console.assert solo escribe en la consola cuando la condicion es
//    FALSA. Asi que lo unico que deberia salir aqui es la cuenta del
//    fizzBuzz y mis lineas de informacion del final.
// =====================================================================

fizzBuzz(15);

console.assert(findMax([3, 7, 2, 9, 1]) === 9, "findMax basic");
console.assert(findMax([-5, -2, -9]) === -2, "findMax negatives");
console.assert(findMax([]) === undefined, "findMax empty");

console.assert(isPalindrome("racecar") === true, "isPalindrome basic");
console.assert(isPalindrome("A man, a plan, a canal: Panama") === true, "isPalindrome punctuation");
console.assert(isPalindrome("hello") === false, "isPalindrome false case");

console.assert(validateEmail("fan@riverside.fc") === true, "email valid");
console.assert(validateEmail("fan@riversidefc") === false, "email needs a dot");
console.assert(validateEmail("fanriverside.fc") === false, "email needs an @");

console.assert(validatePassword("Season2026") === true, "password ok");
console.assert(validatePassword("short1") === false, "password too short");
console.assert(validatePassword("allletters") === false, "password needs a digit");

console.assert(validateLoginForm("fan@riverside.fc", "Season2026").valid === true, "form valid");
console.assert(validateLoginForm("nope", "x").errors.length === 2, "form reports both errors");

// =====================================================================
// 6. UNA FUNCION CON DATOS DE MI SITIO (apartado 5.1, punto 5)
//    Los cuatro deportes de deportes.html y las temporadas que jugue
//    cada uno, metidos a mano en dos arrays. Leer estos datos de la
//    propia pagina es la sesion siguiente.
// =====================================================================

const misDeportes = ["Futbol", "Tenis", "Baloncesto", "Padel"];
const temporadas = [8, 2, 1, 2];

const masTemporadas = findMax(temporadas);
const posicion = temporadas.indexOf(masTemporadas);

console.log("Deporte que mas me duro:", misDeportes[posicion], "-", masTemporadas, "temporadas");
console.log("Es un palindromo el nombre de mi pueblo?", isPalindrome("Paracuellos"));
