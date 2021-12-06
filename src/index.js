import fetch from "node-fetch";
import * as fs from "fs";
import { callReadOnlyFunction, uintCV } from "@stacks/transactions";
import {
  FILE_PATH,
  BASE_URL,
  NETWORK,
  senderAddress,
  DECIMALS,
  GET_MINING_STATS_AT_BLOCK,
  NYCC_CORE,
  NYCC_ADDRESS,
  START_HEIGHT,
} from "./constants.js";

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

async function call(height = 0, action, args) {
  try {
    console.log(action, args);
    const options = {
      contractAddress: NYCC_ADDRESS,
      contractName: NYCC_CORE,
      functionName: action,
      functionArgs: args,
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

async function getData() {
  let height = await getBlockHeight();
  for (let i = START_HEIGHT; i < height; i++) {
    let height = uintCV(i);
    let value = await call(height, GET_MINING_STATS_AT_BLOCK, [height]);
    state.data.push(value);
  }
  fs.appendFileSync(
    FILE_PATH,
    JSON.stringify(state, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

function normalizeSTX(microStx) {
  return Number(microStx) / Math.pow(10, DECIMALS);
}

async function loadState() {
  let rawData = fs.readFileSync(FILE_PATH, "utf8");
  const data = JSON.parse(rawData);
  state = data;
}

// fetchBlockData().then(console.log);
// await getData();
// await loadState();
let height = uintCV(40522);
call(Number(height.value), GET_MINING_STATS_AT_BLOCK, [height]).then(
  console.log
);
