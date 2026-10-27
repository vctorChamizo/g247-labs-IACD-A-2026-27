document.querySelector("#origin").textContent = `Origen actual: ${location.origin}`;
async function request(path, authenticated) {
  const output = document.querySelector("#result");
  const token = document.querySelector("#token").value.trim();
  try {
    const response = await fetch(`http://localhost:3000${path}`, {
      headers: authenticated ? { Authorization: `Bearer ${token}` } : {},
    });
    output.textContent = `HTTP ${response.status}\n${JSON.stringify(await response.json(), null, 2)}`;
  } catch {
    output.textContent = "El navegador no permite leer la respuesta o la API está caída. Revisar Network/Console y comparar con Postman.";
  }
}
document.querySelector("#health").addEventListener("click", () => request("/health", false));
document.querySelector("#tasks").addEventListener("click", () => request("/tasks", true));
