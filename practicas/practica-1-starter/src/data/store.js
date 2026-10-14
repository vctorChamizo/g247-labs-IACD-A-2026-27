let books = [];
let nextId = 1;

function list() {
  return books;
}

function create({ title, pages, available, genre }) {
  const book = { id: nextId++, title, pages, available, genre };
  books.push(book);
  return book;
}

// TODO: añadir findById, replace, update y remove.
// Cada función debe ser el único lugar que modifica el array.

module.exports = { list, create };

