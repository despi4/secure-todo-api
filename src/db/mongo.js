const { MongoClient } = require("mongodb");

let client;
let db;

async function connectMongo(uri, dbName) {
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

function getDb() {
  if (!db) throw new Error("DB not initialized");
  return db;
}

function getClient() {
  return client;
}

module.exports = { connectMongo, getDb, getClient };
