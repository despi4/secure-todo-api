const app = require("./app");
const { connectMongo } = require("./db/mongo");

const PORT = process.env.PORT || 3000;

(async () => {
  await connectMongo(process.env.MONGO_URI, process.env.MONGO_DB);
  app.listen(PORT, () => console.log(`API running on :${PORT}`));
})();
