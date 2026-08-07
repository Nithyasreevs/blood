const mongoose = require('mongoose');

const initCollections = async () => {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.listCollections().toArray();
  console.log(`📦 MongoDB connected with ${collections.length} existing collection(s) — no seed data injected`);
};

module.exports = initCollections;
