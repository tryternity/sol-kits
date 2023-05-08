// noinspection JSUnusedGlobalSymbols

import {Keypair, PublicKey} from "@solana/web3.js";
import fs from "fs";
import {Buffer} from "buffer";
import {Wallet} from "@project-serum/anchor";

export type Address = PublicKey | Keypair | Buffer | string | Wallet;

export module account {

    export function fromBytes(key_bytes: number[]): Keypair {
        return Keypair.fromSecretKey(new Uint8Array(key_bytes))
    }

    export function fromFile(file: string): Keypair {
        let bytes = JSON.parse(fs.readFileSync(file, 'utf-8'))
        return Keypair.fromSecretKey(new Uint8Array(bytes));
    }

    export function toPubicKey(value: Address): PublicKey {
        if (value instanceof Buffer) {
            return new PublicKey(value);
        } else if (value instanceof Keypair) {
            return value.publicKey;
        } else if (value instanceof PublicKey) {
            return value;
        } else if (value instanceof Wallet) {
            return value.publicKey;
        } else if (value.startsWith("0x")) {
            return new PublicKey(Buffer.from(value.substring(2), 'hex'));
        } else {
            return new PublicKey(value);
        }
    }

    export type SEED_TYPE = PublicKey | string | number;

    export function pda(programId: PublicKey, seeds: SEED_TYPE[]): PublicKey {
        let buffs = new Array<Buffer>();
        for (let seed of seeds) {
            buffs.push(seed instanceof PublicKey ? seed.toBuffer() : Buffer.from(seed + ""))
        }
        return PublicKey.findProgramAddressSync(buffs, programId)[0];
    }

    export async function dataOfPda(fetch: () => any): Promise<any> {
        try {
            return await fetch();
        } catch (e) {
            if ((e as any).message.indexOf("Account does not exist") > -1) {
                return null;
            } else {
                throw e;
            }
        }
    }
}