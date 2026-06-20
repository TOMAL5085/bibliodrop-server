require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { createApp } = require("./src/app");

const app = createApp();

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT || "5000", 10);
  app.listen(port, () => {
    console.log(`BiblioDrop API listening on port ${port}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
