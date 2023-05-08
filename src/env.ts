// noinspection JSUnusedGlobalSymbols

import {Cluster as ClusterA, clusterApiUrl, Connection, Keypair} from "@solana/web3.js";
import {account} from "./account";
import {Wallet} from "@project-serum/anchor";

export type Cluster = ClusterA | "local";

export module env {

    export function connection(cluster: Cluster = "devnet"): Connection {
        let network = cluster == "local" ? "http://127.0.0.1:8899" : clusterApiUrl(cluster);
        return new Connection(network, {
            commitment: 'processed',
            confirmTransactionInitialTimeout: 120 * 1000
        });
    }

    export let wallet: Keypair = account.localWallet();
    export let defaultConnection: Connection = env.connection("devnet");

    export function setEnv(cluster?: Cluster, payer?: Keypair | Wallet): Connection {
        if (cluster) {
            defaultConnection = env.connection(cluster);
        }
        if (payer) {
            wallet = payer instanceof Keypair ? payer : payer.payer;
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