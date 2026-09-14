// Datos y funciones procedentes de la semana 3 ----------------------

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

const attemptedGrades = [3, 4, 6, 8];

function classifyNumber(number) {
  if (number % 2 === 0 && number % 4 === 0) {
    return `${number} es par y múltiplo de 4.`;
  }

  if (number % 2 === 0) {
    return `${number} es par, pero no múltiplo de 4.`;
  }

  return `${number} es impar.`;
}

function findFirstPassingGrade(grades) {
  let index = 0;
  let firstPassingGrade = null;

  while (index < grades.length && firstPassingGrade === null) {
    if (grades[index] >= 5) {
      firstPassingGrade = grades[index];
    }

    index += 1;
  }

  return firstPassingGrade;
}

// DOM y eventos ------------------------------------------------------

const personButton = document.querySelector("#person-button");
const personResult = document.querySelector("#person-result");
const numberInput = document.querySelector("#number-input");
const classifyButton = document.querySelector("#classify-button");
const classificationResult = document.querySelector("#classification-result");
const gradeButton = document.querySelector("#grade-button");
const gradeResult = document.querySelector("#grade-result");

function showPerson() {
  const enrollmentStatus = person.isEnrolled ? "matriculada" : "sin matrícula";
  personResult.textContent = `${person.name}, ${person.age} años · ${enrollmentStatus} · ${person.subjects[0]} · Campus ${person.address.campus}.`;
}

function showClassification() {
  const number = Number(numberInput.value);
  classificationResult.textContent = classifyNumber(number);
}

function showFirstPassingGrade() {
  const firstPassingGrade = findFirstPassingGrade(attemptedGrades);
  gradeResult.textContent = `Notas: ${attemptedGrades.join(", ")}. Primera nota aprobada: ${firstPassingGrade}.`;
}

personButton.addEventListener("click", showPerson);
classifyButton.addEventListener("click", showClassification);
gradeButton.addEventListener("click", showFirstPassingGrade);
