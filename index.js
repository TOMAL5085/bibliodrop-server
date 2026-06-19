require("dotenv").config();

const { createApp } = require("./src/app");

const port = Number.parseInt(process.env.PORT || "5000", 10);
const app = createApp();

app.listen(port, () => {
  console.log(`BiblioDrop API listening on port ${port}`);
});
