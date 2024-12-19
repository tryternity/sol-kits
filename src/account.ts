// noinspection JSUnusedGlobalSymbols

import {Keypair, PublicKey} from "@solana/web3.js";
import fs from "fs";
import {Buffer} from "buffer";
import {Wallet} from "@coral-xyz/anchor";
import {ePrint, kits} from "./kits";
import * as token from "@solana/spl-token";
import {env} from "./env";

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
    } else if ((value as String).startsWith("0x")) {
      return new PublicKey(Buffer.from((value as String).substring(2), 'hex'));
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

  export function localWallet(): Keypair {
    return account.fromFile(kits.userHome() + "/.config/solana/id.json");
  }

  export async function ata(user: Address, mint: PublicKey): Promise<PublicKey> {
    let key = account.toPubicKey(user);
    let ata = await token.getOrCreateAssociatedTokenAccount(env.defaultConnection, env.wallet, mint, key).catch(ePrint)
    return ata.address;
  }

  export function findProgramAddress(programId: PublicKey | string, buffers: (String | PublicKey | number | Buffer)[]): [PublicKey, number] {
    let seeds: Buffer[] = buffers.map((v, _i) => {
      if (v instanceof PublicKey) {
        return v.toBuffer();
      } else if (v instanceof Buffer) {
        return v;
      } else {
        return Buffer.from(v + "");
      }
    });
    return PublicKey.findProgramAddressSync(seeds,
        programId instanceof PublicKey ? programId : new PublicKey(programId));
  }
}