const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Practice 1 starter listening on http://localhost:${PORT}`);
});

