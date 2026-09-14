// Abrir las herramientas para desarrolladores del navegador y consultar esta salida en la consola.
// Cada bloque muestra una idea concreta antes de combinarla con las siguientes.

console.log("--- 1. Variables y tipos de datos ---");

// `const` se usa para un valor que no se reasignará durante el programa.
const courseName = "Programación de Aplicaciones Web";

// `let` se usa cuando el valor necesita cambiar. Aquí representa un contador.
let completedExercises = 0;

// La asignación nueva sería un error con `const`, pero es válida con `let`.
completedExercises += 1;

// `typeof` permite observar que JavaScript identifica el tipo a partir del valor.
console.log(courseName);
console.log("Ejercicios completados:", completedExercises);
console.log("typeof courseName:", typeof courseName);
console.log("typeof completedExercises:", typeof completedExercises);

console.log("--- 2. Primitivos y referencias ---");

// Un string es un valor primitivo. Al asignarlo se copia el valor, no una conexión con la variable original.
let firstStudent = "Ana";
let secondStudent = firstStudent;
secondStudent = "Bruno";

console.log("Primitivo:", { firstStudent, secondStudent });

// Un array es un objeto. Ambas variables se refieren al mismo array en memoria.
const firstTopics = ["HTML", "CSS"];
const secondTopics = firstTopics;

// Al modificar una referencia, el cambio se observa también desde la otra variable.
secondTopics.push("JavaScript");

console.log("Referencia:", { firstTopics, secondTopics });

// Un objeto permite agrupar datos relacionados bajo nombres descriptivos.
// Sus propiedades pueden almacenar valores de distintos tipos, incluso arrays y otros objetos.
const person = {
  name: "Lucía Martín",
  age: 20,
  isEnrolled: true,
  contactEmail: null,
  subjects: ["Programación de Aplicaciones Web", "Bases de datos"],
  address: {
    city: "Madrid",
    campus: "Pirineos",
  },
};

console.log("Objeto persona:", person);
console.log("Primera asignatura:", person.subjects[0]);
console.log("Campus:", person.address.campus);

console.log("--- 3. Condicionales y bucles ---");

// La función recibe un límite y devuelve un array para poder probarla con distintos valores.
function classifyNumbers(limit) {
  const results = [];

  // `for` es útil cuando se conoce el número de repeticiones de antemano.
  for (let number = 1; number <= limit; number += 1) {
    // El primer caso combina dos condiciones: ser par y múltiplo de 4.
    // El orden importa: todo múltiplo de 4 también es par, así que este caso debe comprobarse primero.
    if (number % 2 === 0 && number % 4 === 0) {
      results.push(`${number}: par y múltiplo de 4`);
    } else if (number % 2 === 0) {
      // Si no cumple el caso anterior, un resto 0 al dividir entre 2 identifica un número par.
      results.push(`${number}: par, pero no múltiplo de 4`);
    } else {
      // Si el resto no es 0, no puede dividirse exactamente entre 2: es impar.
      results.push(`${number}: impar`);
    }
  }

  return results;
}

console.log("Clasificación hasta 10:", classifyNumbers(10));

// `while` repite mientras una condición sea verdadera. Aquí no se conoce de antemano cuántas notas
// habrá que revisar: el bucle termina al encontrar el primer aprobado o al agotar las notas disponibles.
function findFirstPassingGrade(grades) {
  let index = 0;
  let firstPassingGrade = null;

  // Las dos condiciones protegen casos distintos: no salir del array y parar cuando ya se ha aprobado.
  while (index < grades.length && firstPassingGrade === null) {
    const currentGrade = grades[index];

    if (currentGrade >= 5) {
      firstPassingGrade = currentGrade;
    }

    // El índice debe avanzar incluso si se encuentra un aprobado; así no se corre el riesgo de un bucle infinito.
    index += 1;
  }

  return firstPassingGrade;
}

const attemptedGrades = [3, 4, 6, 8];
console.log("Primera nota aprobada:", findFirstPassingGrade(attemptedGrades));

console.log("--- 4. Funciones reutilizables ---");

// Esta función recibe un array y devuelve un único valor: el mayor de sus elementos.
// No utiliza `Math.max` para practicar un acumulador y un condicional dentro de un bucle.
function findMaximum(numbers) {
  let maximum = numbers[0];

  // `for...of` recorre directamente cada valor del array, sin manejar índices.
  for (const number of numbers) {
    if (number > maximum) {
      maximum = number;
    }
  }

  return maximum;
}

// Los mismos datos se pasan a la función para obtener un resultado sin cambiar el array original.
const scores = [7, 9, 4, 10, 8];
console.log("Puntuación máxima:", findMaximum(scores));

// Una función flecha se guarda en una constante igual que cualquier otro valor.
// Se invierte el texto carácter a carácter para comprobar si se lee igual en ambos sentidos.
const isPalindrome = (text) => {
  const normalizedText = text.toLowerCase();
  let reversedText = "";

  // Aquí se conoce el índice inicial y final, por eso un `for` clásico resulta apropiado.
  for (let index = normalizedText.length - 1; index >= 0; index -= 1) {
    reversedText += normalizedText[index];
  }

  // La función devuelve un boolean: `true` si ambos textos coinciden y `false` si no.
  return normalizedText === reversedText;
};

console.log("¿'reconocer' es un palíndromo?", isPalindrome("reconocer"));
console.log("¿'JavaScript' es un palíndromo?", isPalindrome("JavaScript"));
