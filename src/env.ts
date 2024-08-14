// noinspection JSUnusedGlobalSymbols

import {clusterApiUrl, Connection, Keypair, PublicKey} from "@solana/web3.js";
import {account} from "./account";
import {createUmi} from "@metaplex-foundation/umi-bundle-defaults";
import {createSignerFromKeypair, keypairIdentity, publicKey, Umi} from "@metaplex-foundation/umi";
import {fromWeb3JsKeypair, fromWeb3JsPublicKey} from "@metaplex-foundation/umi-web3js-adapters";
import {PublicKey as UmiPublicKey} from "@metaplex-foundation/umi-public-keys/dist/types/common";

export enum Env {
  local = 0,
  devnet = 1,
  mainnet = 2
}

export module env {
  export const SPL_TOKEN_2022_PROGRAM_ID: UmiPublicKey = publicKey(
      'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
  )
  export function cluster(env: Env | string = Env.devnet): string {
    if (typeof env == 'string') {
      return env;
    } else if (env == Env.local) {
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

  export function umi(env?: Env | string, signer?: Keypair) {
    let endpoint = typeof env == 'string' ? env : cluster(env ?? Env.devnet);
    const umi = createUmi(endpoint)
    const keypair = createSignerFromKeypair(umi, fromWeb3JsKeypair(signer ?? wallet));
    umi.use(keypairIdentity(keypair))
    return umi;
  }

  export function toUmiPublicKey(newOwner: PublicKey | string) {
    return fromWeb3JsPublicKey(typeof newOwner == 'string' ? new PublicKey(newOwner) : newOwner);
  }

  export function toUmiSigner(signer: Keypair, umi?: Umi) {
    return createSignerFromKeypair(umi ?? env.umi(), fromWeb3JsKeypair(signer))
  }
}