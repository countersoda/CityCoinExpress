import express from "express";
import { MongoClient } from "mongodb";

const MONGODB_URL = "mongodb://127.0.0.1:27017/local";
const app = express();

const port = 5000;

const initDB = async () => {
  const client = await MongoClient.connect(MONGODB_URL);
  const collection = client.db("local").collection("stacks-blockchain");
  return collection;
};

const db = await initDB();

app.get("/", async (req, res) => {
  try {
    const entries = await db.find({});
    let result = [];
    let hasNext = await entries.hasNext();
    while (hasNext) {
      const document = await entries.next();
      result.push(document);
      hasNext = await entries.hasNext();
    }
    res.send({ total: result.length, result });
  } catch (error) {
    res.send(error);
  }
});

app.listen(port);
