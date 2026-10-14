const status = document.querySelector("#status");
const checkConnectionButton = document.querySelector("#check-connection");

async function checkConnection() {
  // El código de cliente se ejecuta en el navegador, no en Node.js.
  // La URL relativa apunta al mismo origen que entregó index.html.
  status.textContent = "Comprobando conexión…";
  status.className = "message";

  try {
    const response = await fetch("/health");
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    status.textContent = `Conexión con el servidor correcta: ${data.status}.`;
  } catch (error) {
    status.textContent = error.message;
    status.className = "message error";
  }
}

checkConnectionButton.addEventListener("click", checkConnection);

// TODO: añadir aquí las funciones de interfaz cuando el contrato de la API esté
// definido. Cada interacción deberá usar fetch, comprobar response.ok y mostrar
// los estados de carga, error y lista vacía sin recargar la página.
