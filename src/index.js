import fetch from "node-fetch";
import { callReadOnlyFunction, uintCV } from "@stacks/transactions";
import {
  BASE_URL,
  NETWORK,
  senderAddress,
  DECIMALS,
  GET_MINING_STATS_AT_BLOCK,
  NYCC_CORE,
  NYCC_ADDRESS,
  START_HEIGHT,
  MONGODB_URL,
  GET_REGISTERED_USERS_NONCE,
  GET_MINER_AT_BLOCK,
} from "./constants.js";
import { MongoClient } from "mongodb";

async function getBlockHeight() {
  try {
    const result = await fetch(BASE_URL + "/extended/v1/block", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());
    const { total } = result;
    return total;
  } catch (error) {
    console.log(error);
  }
}

async function getAmountOfMiners() {
  try {
    const options = {
      contractAddress: NYCC_ADDRESS,
      contractName: NYCC_CORE,
      functionName: GET_REGISTERED_USERS_NONCE,
      functionArgs: [],
      network: NETWORK,
      senderAddress,
    };
    let result = await callReadOnlyFunction(options);
    const data = result.value;
    return Number(data);
  } catch (error) {
    console.log(error);
  }
}

async function getMiningStatsAtBlock(height = 0) {
  try {
    height = uintCV(height);
    const options = {
      contractAddress: NYCC_ADDRESS,
      contractName: NYCC_CORE,
      functionName: GET_MINING_STATS_AT_BLOCK,
      functionArgs: [height],
      network: NETWORK,
      senderAddress,
    };
    let result = await callReadOnlyFunction(options);
    if (result.type === 9) return;
    const data = result.value.data;
    return {
      minersCount: Number(data.minersCount.value),
      amount: normalizeSTX(data.amount.value),
    };
  } catch (error) {
    console.log(error);
  }
}

async function getMinerAtBlock(height = 0, id = 1) {
  try {
    height = uintCV(height);
    id = uintCV(id);
    const options = {
      contractAddress: NYCC_ADDRESS,
      contractName: NYCC_CORE,
      functionName: GET_MINER_AT_BLOCK,
      functionArgs: [height, id],
      network: NETWORK,
      senderAddress,
    };
    let result = await callReadOnlyFunction(options);
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function getAllMinersAtBlock(height, amountAtBlock) {
  const totalMiner = await getAmountOfMiners();
  let minersAtBlock = [];
  let winningAmount = 0;
  for (let id = 1; id < totalMiner; id++) {
    const miner = await getMinerAtBlock(height, id);
    if (miner.type !== 9) {
      const data = miner.value.data;
      const isWinner = data.winner.type === 3;
      const minerData = {
        id,
        spendSTX: normalizeSTX(data.ustx.value),
        winner: isWinner,
      };
      if (isWinner) winningAmount = minerData.spendSTX;
      minersAtBlock.push(minerData);
    }
    if (minersAtBlock.length === amountAtBlock) break;
  }
  const sum = (total, current) => total + current.spendSTX;
  let avgSTX = minersAtBlock.reduce(sum, 0) / amountAtBlock;
  return { miner: minersAtBlock, winningAmount, avgSTX };
}

async function getData() {
  let totalHeight = await getBlockHeight();
  for (let height = START_HEIGHT; height < totalHeight; height++) {
    const { amount, minersCount } = await getMiningStatsAtBlock(height);
    const { miner, winningAmount, avgSTX } = await getAllMinersAtBlock(
      height,
      minersCount
    );
    const entry = {
      _id: height,
      amount_miner: minersCount,
      totalSTX: amount,
      avgSTX,
      winningAmount,
      miner,
    };
    console.log(entry);
    await db.insertOne(entry);
  }
}

function normalizeSTX(microStx) {
  return Number(microStx) / Math.pow(10, DECIMALS);
}

async function loadDB() {
  const client = await MongoClient.connect(MONGODB_URL);
  const collection = client.db("local").collection("stacks-blockchain");
  db = collection;
}

var db = null;
await loadDB();
await getData();
