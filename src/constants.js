import { StacksMainnet } from "@stacks/network";

/**
 * Stacks config
 */
export const BASE_URL = "http://localhost:3999";
export const NYCC_ADDRESS = "SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5";
export const NYCC_CORE = "newyorkcitycoin-core-v1";
export const NETWORK = new StacksMainnet({ url: BASE_URL });

export const START_HEIGHT = 37451;
export const DECIMALS = 6;
export const senderAddress = "ST2F4BK4GZH6YFBNHYDDGN4T1RKBA7DA1BJZPJEJJ";

/**
 * Smart Contract function calls
 */
export const GET_MINING_STATS_AT_BLOCK = "get-mining-stats-at-block";
export const GET_REGISTERED_USERS_NONCE = "get-registered-users-nonce";
export const GET_MINER_AT_BLOCK = "get-miner-at-block"

/**
 * MongoDB config
 */
export const MONGODB_URL = "mongodb://127.0.0.1:27017/local";
