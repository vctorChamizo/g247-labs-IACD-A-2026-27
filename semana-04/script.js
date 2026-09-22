// =====================================================================
// PARTE 1 — ARRAYS Y CONTROL DE FLUJO
// Los resultados de este bloque se consultan en la consola del navegador.
// =====================================================================

// Cada elemento del array es un objeto con varios tipos de datos.

const workshops = [
  { id: 101, title: "HTML semántico", isOpen: false, availableSeats: 0 },
  { id: 102, title: "CSS responsive", isOpen: true, availableSeats: 2 },
  { id: 103, title: "JavaScript y DOM", isOpen: true, availableSeats: 8 },
];

function getRegistrationMessage(workshop) {
  // `find` puede no encontrar un resultado. En ese caso devuelve undefined.
  if (workshop === undefined) {
    return "No existe un taller con ese identificador.";
  }

  // `!` niega un boolean y `||` permite contemplar dos motivos de cierre.
  if (!workshop.isOpen || workshop.availableSeats === 0) {
    return `${workshop.title}: inscripciones cerradas.`;
  }

  // `&&` exige que las dos condiciones se cumplan al mismo tiempo.
  if (workshop.isOpen && workshop.availableSeats <= 2) {
    return `${workshop.title}: últimas ${workshop.availableSeats} plazas.`;
  }

  return `${workshop.title}: ${workshop.availableSeats} plazas disponibles.`;
}

console.group("Parte 1 · Arrays y control de flujo");
console.table(workshops);

// `some` responde una pregunta con un boolean: true si al menos un elemento cumple la condición.

const hasFullWorkshop = workshops.some((workshop) => workshop.availableSeats === 0);
console.log("¿Hay algún taller completo?", hasFullWorkshop);

// `find` devuelve el primer objeto que coincide con la condición.
const selectedWorkshop = workshops.find((workshop) => workshop.id === 102);
console.log("Taller con id 102:", selectedWorkshop);

// `findIndex` devuelve la posición del elemento. Si no lo encontrase, devolvería -1.
const selectedWorkshopIndex = workshops.findIndex((workshop) => workshop.id === 102);
console.log("Posición del taller 102:", selectedWorkshopIndex);

// `filter` genera un array nuevo con los elementos que cumplen la condición.
const openWorkshops = workshops.filter((workshop) => !workshop.isOpen);
console.log("Talleres abiertos:", openWorkshops);

// `forEach` ejecuta una acción por cada elemento; no crea ni devuelve un array nuevo.
workshops.forEach((workshop) => {
  const result = getRegistrationMessage(workshop);
  console.log(result);
});

// `map` transforma todos los elementos y devuelve un array nuevo con el resultado.
const workshopTitles = workshops.map((workshop) => workshop.title);
console.log("Títulos de talleres abiertos:", workshopTitles);
console.groupEnd();

// =====================================================================
// PARTE 2 — DOM
// Este bloque hace visible en la página el resultado de eventos y cambios.
// =====================================================================

// `querySelectorAll` devuelve una NodeList con los tres botones de mensaje.
const messageButtons = document.querySelectorAll(".message-button");
const messageOutput = document.querySelector("#message-output");

messageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // El atributo data-message se consulta desde dataset y actualiza un nodo ya existente.
    messageOutput.textContent = button.dataset.message;

    // Recorrer los botones permite que solo el que se ha pulsado conserve el estado activo.
    messageButtons.forEach((currentButton) => {
      currentButton.classList.toggle("is-active", currentButton === button);
    });
  });
});
