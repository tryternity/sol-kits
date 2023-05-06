// noinspection JSUnusedGlobalSymbols

import * as anchor from "@project-serum/anchor";
import {Connection, Keypair, PublicKey, Transaction} from "@solana/web3.js";
import {ePrint} from "./kits";
import * as token from "@solana/spl-token";
import {getOrCreateAssociatedTokenAccount} from "@solana/spl-token";

export module tx {
    export function additionalComputeBudget(units: number = 400000): anchor.web3.TransactionInstruction[] {
        return [anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
            units: units
        })];
    }

    export type PartialSign = (txBase64: string) => Promise<string>;

    export async function partialSignTx(mintTx: Transaction, signer: Keypair | PartialSign): Promise<Transaction> {
        let txBase64 = mintTx.serialize({
            requireAllSignatures: false,
        }).toString("base64");
        txBase64 = signer instanceof Keypair ? await simulatePartialSign(txBase64, signer) : await signer(txBase64);
        return Transaction.from(Buffer.from(txBase64, "base64"));
    }

    async function simulatePartialSign(txBase64: string, signer: Keypair): Promise<string> {
        let tx = Transaction.from(Buffer.from(txBase64, "base64"));
        tx.partialSign(signer);
        return tx.serialize({
            requireAllSignatures: false,
        }).toString("base64");
    }

    export async function createMint(arg: {
        connection: Connection,
        payer: Keypair,
        decimals?: number
    }): Promise<PublicKey> {
        console.log("Begin to createGmtToken");
        return await token.createMint(
            arg.connection,
            arg.payer,
            arg.payer.publicKey,
            arg.payer.publicKey,
            arg.decimals ?? 0
        ).catch(ePrint);
    }

    export async function airdrop(arg: {
        connection: Connection,
        payerOrOwner: Keypair,
        toUser: PublicKey,
        amount?: number,
        mint?: PublicKey
    }) {
        let connection = arg.connection;
        let owner = arg.toUser;
        let amount = arg.amount ?? 1;
        if (arg.mint == undefined) {
            const signature = await connection.requestAirdrop(owner, amount).catch(ePrint);
            await connection.confirmTransaction(signature).catch(ePrint);
            await connection.getBalance(owner, {commitment: "confirmed"}).catch(ePrint);
        } else {
            console.log("Begin mintTo", owner.toBase58(), arg.mint.toBase58(), amount);
            let ata = await getOrCreateAssociatedTokenAccount(connection, arg.payerOrOwner, arg.mint, owner);
            await token.mintTo(
                connection,
                arg.payerOrOwner,
                arg.mint,
                ata.address,
                arg.payerOrOwner.publicKey,
                amount
            ).catch(ePrint);
        }
    }

    export async function transfer(arg: {
        connection: Connection,
        mint: PublicKey,
        from: Keypair,
        to: PublicKey,
        amount?: number
    }) {
        let connection = arg.connection;
        let payer = arg.from;
        let fromAccount = (await getOrCreateAssociatedTokenAccount(connection, payer, arg.mint, payer.publicKey)).address;
        let toAccount = (await getOrCreateAssociatedTokenAccount(connection, payer, arg.mint, arg.to)).address;
        await token.transfer(connection, payer, fromAccount, toAccount, payer.publicKey, arg.amount ?? 1).catch(ePrint);
    }
}