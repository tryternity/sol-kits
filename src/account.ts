import {Keypair, PublicKey} from "@solana/web3.js";
import fs from "fs";
import {Buffer} from "buffer";

export module account {
    export type Address = PublicKey | Keypair | Buffer | string;

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
        } else if (value.startsWith("0x")) {
            return new PublicKey(Buffer.from(value.substring(2), 'hex'));
        } else {
            return new PublicKey(value);
        }
    }
}