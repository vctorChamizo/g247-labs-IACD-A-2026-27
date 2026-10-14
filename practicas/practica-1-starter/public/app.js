const list = document.querySelector("#book-list");
const status = document.querySelector("#status");
const reloadButton = document.querySelector("#reload-button");
const form = document.querySelector("#book-form");
const formErrors = document.querySelector("#form-errors");

async function loadBooks() {
  status.textContent = "Loading…";
  status.className = "message";

  try {
    const response = await fetch("/books");
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const books = await response.json();
    list.replaceChildren();

    if (books.length === 0) {
      status.textContent = "There are no books yet.";
      return;
    }

    status.textContent = "";
    for (const book of books) {
      const item = document.createElement("li");
      item.textContent = book.title;
      list.append(item);
    }
  } catch (error) {
    status.textContent = error.message;
    status.className = "message error";
  }
}

reloadButton.addEventListener("click", loadBooks);

form.addEventListener("submit", async (event) => {
  // Sin preventDefault, el navegador haría un GET convencional y cambiaría la URL.
  event.preventDefault();
  formErrors.textContent = "";

  const formData = new FormData(form);
  const body = {
    title: formData.get("title"),
    pages: Number(formData.get("pages")),
    available: form.elements.available.checked,
    genre: formData.get("genre"),
  };

  try {
    const response = await fetch("/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (!response.ok) {
      const messages = data.errors?.map((error) => error.message) || [data.error];
      formErrors.textContent = messages.join(" ");
      return;
    }

    form.reset();
    await loadBooks();
  } catch (error) {
    formErrors.textContent = error.message;
  }
});

// TODO: incorporar edición, eliminación, búsqueda y filtros sin recargar la página.

loadBooks();
