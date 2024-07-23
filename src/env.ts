// noinspection JSUnusedGlobalSymbols

import {clusterApiUrl, Connection, Keypair} from "@solana/web3.js";
import {account} from "./account";

export enum Env {
  local = 0,
  devnet = 1,
  mainnet = 2
}

export module env {

  export function cluster(env: Env = Env.devnet): string {
    if (env == Env.local) {
      return "http://127.0.0.1:8899";
    } else {
      return clusterApiUrl(env == Env.devnet ? "devnet" : "mainnet-beta");
    }
  }

  export function connection(env?: Env | string): Connection {
    let network = typeof env == 'string' ? env : cluster(env ?? Env.devnet);
    return new Connection(network, {
      commitment: 'processed',
      confirmTransactionInitialTimeout: 120 * 1000
    });
  }

  export let wallet: Keypair = account.localWallet();
  export let defaultConnection: Connection = env.connection();

  export function setEnv(cluster?: Env | string, payer?: Keypair): Connection {
    if (cluster) {
      defaultConnection = env.connection(cluster);
    }
    if (payer) {
      wallet = payer;
    }
    return defaultConnection;
  }

  export function setConnection(connection: Connection) {
    defaultConnection = connection;
  }

  export function setPayer(payer: Keypair) {
    wallet = payer;
  }
}