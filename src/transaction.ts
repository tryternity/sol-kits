// noinspection JSUnusedGlobalSymbols

import * as anchor from "@project-serum/anchor";
import {web3} from "@project-serum/anchor";
import {Cluster as ClusterA, clusterApiUrl, Connection, Keypair, PublicKey, Transaction} from "@solana/web3.js";
import {ePrint} from "./kits";
import * as token from "@solana/spl-token";
import {getMint, getOrCreateAssociatedTokenAccount} from "@solana/spl-token";
import {account, Address} from "./account";

export type Cluster = ClusterA | "local";
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
        payer?: Keypair,
        decimals?: number
    }): Promise<PublicKey> {
        console.log("Begin to createGmtToken");
        let payer = arg.payer ?? account.localWallet();
        return await token.createMint(
            arg.connection,
            payer,
            payer.publicKey,
            payer.publicKey,
            arg.decimals ?? 0
        ).catch(ePrint);
    }

    export async function airDrop(arg: {
        connection: Connection,
        toUser: PublicKey,
        payerOrOwner?: Keypair,
        amount?: number,
        mint?: PublicKey
    }): Promise<string> {
        let connection = arg.connection;
        let owner = arg.toUser;
        let amount = arg.amount ?? 1;
        if (arg.mint == undefined) {
            const signature = await connection.requestAirdrop(owner, web3.LAMPORTS_PER_SOL * amount).catch(ePrint);
            await connection.confirmTransaction(signature).catch(ePrint);
            await connection.getBalance(owner, {commitment: "confirmed"}).catch(ePrint);
            return signature;
        } else {
            console.log("Begin mintTo", owner.toBase58(), arg.mint.toBase58(), amount);
            let payerOrOwner = arg.payerOrOwner ?? account.localWallet();
            let mint = await getMint(connection, arg.mint).catch(ePrint);
            let ata = await getOrCreateAssociatedTokenAccount(connection, payerOrOwner, arg.mint, owner);
            return await token.mintTo(
                connection,
                payerOrOwner,
                arg.mint,
                ata.address,
                payerOrOwner.publicKey,
                amount * Math.pow(10, mint.decimals)
            ).catch(ePrint);
        }
    }

    export async function airDrops(arg: {
        connection: Connection,
        payerOrOwner: Keypair,
        toUsers: Address[],
        amount?: number,
        mint?: PublicKey
    }): Promise<string[]> {
        let sigs: string[] = [];
        for (let user of arg.toUsers) {
            sigs.push(await airDrop({
                connection: arg.connection,
                payerOrOwner: arg.payerOrOwner,
                toUser: account.toPubicKey(user),
                amount: arg.amount,
                mint: arg.mint
            }));
        }
        return sigs;
    }

    export async function transfer(arg: {
        connection: Connection,
        from: Keypair,
        to: PublicKey,
        amount?: number,
        mint?: PublicKey
    }): Promise<string> {
        let connection = arg.connection;
        let payer = arg.from;
        let amount = arg.amount ?? 1;
        if (arg.mint == undefined) {
            const instruction = web3.SystemProgram.transfer({
                    fromPubkey: arg.from.publicKey,
                    toPubkey: arg.to,
                    lamports: web3.LAMPORTS_PER_SOL * amount
                }
            );
            let tx = new web3.Transaction().add(instruction);
            return await web3.sendAndConfirmTransaction(connection, tx, [arg.from]).catch(ePrint);
        } else {
            let mint = await getMint(connection, arg.mint).catch(ePrint);
            let fromAccount = (await getOrCreateAssociatedTokenAccount(connection, payer, arg.mint, payer.publicKey)).address;
            let toAccount = (await getOrCreateAssociatedTokenAccount(connection, payer, arg.mint, arg.to)).address;
            return await token.transfer(connection, payer, fromAccount, toAccount, payer.publicKey, amount * Math.pow(10, mint.decimals)).catch(ePrint);
        }
    }

    export function connection(cluster: Cluster = "devnet"): Connection {
        let network = cluster == "local" ? "http://127.0.0.1:8899" : clusterApiUrl(cluster);
        return new Connection(network, {
            commitment: 'processed',
            confirmTransactionInitialTimeout: 120 * 1000
        });
    }
}