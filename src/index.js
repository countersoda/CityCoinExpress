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

var state = { data: [], totalMiners: 0 };

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
    result = {
      block: height,
      minersCount: data.minersCount.value,
      amount: normalizeSTX(data.amount.value),
    };

    return result;
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

async function getData() {
  let totalHeight = await getBlockHeight();
  const totalMiner = await getAmountOfMiners();
  for (let height = START_HEIGHT; height < totalHeight; height++) {
    let miningStats = await getMiningStatsAtBlock(height);
    let minersAtBlock = [];
    for (let id = 1; id < totalMiner; id++) {
      const miner = await getMinerAtBlock(START_HEIGHT, id);
      if (miner.type !== 9) {
        let data = miner.value.data;
        minerData = {
          id,
          spendSTX: data.ustx,
          winner: data.winner,
        };
        minersAtBlock.push(minerData);
      }
      if (minersAtBlock.length === miningStats.minersCount) break;
    }
    const entry = {
      _id: height,
      totalMiner: miningStats.minersCount,
      miner: minersAtBlock,
    };
    
  }
}

function normalizeSTX(microStx) {
  return Number(microStx) / Math.pow(10, DECIMALS);
}

async function loadDB() {
  const client = await MongoClient.connect(MONGODB_URL);
  const collection = client.db("local").collection("stacks-blockchain");
  return collection;
}

// fetchBlockData().then(console.log);
// await getData();
// await loadState();
// let height = uintCV(40522);
// call(Number(height.value), GET_MINING_STATS_AT_BLOCK, [height]).then(
//   console.log
// );
// const stacks = await loadDB();

// const result = await stacks.findOne({ _id: 40522 });
