// noinspection JSUnusedGlobalSymbols

import * as anchor from "@project-serum/anchor";
import {web3} from "@project-serum/anchor";
import {
    AddressLookupTableAccount,
    Connection,
    Keypair,
    PublicKey,
    Signer,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";
import {ePrint} from "./kits";
import * as token from "@solana/spl-token";
import {getMint, getOrCreateAssociatedTokenAccount} from "@solana/spl-token";
import {account, Address} from "./account";
import {env} from "./env";

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

    export async function createMint(options?: {
        connection?: Connection,
        payer?: Keypair,
        decimals?: number
    }): Promise<PublicKey> {
        console.log("Begin to createGmtToken");
        let payer = options?.payer ?? env.wallet;
        return await token.createMint(
            options?.connection ?? env.defaultConnection,
            payer,
            payer.publicKey,
            payer.publicKey,
            options?.decimals ?? 0
        ).catch(ePrint);
    }

    export async function airDrop(user: Address, options?: {
        connection?: Connection,
        payerOrOwner?: Keypair,
        amount?: number,
        mint?: PublicKey
    }): Promise<string> {
        let connection = options?.connection ?? env.defaultConnection;
        let amount = options?.amount ?? 1;
        let userKey = account.toPubicKey(user);
        if (options?.mint == undefined) {
            const signature = await connection.requestAirdrop(userKey, web3.LAMPORTS_PER_SOL * amount).catch(ePrint);
            await connection.confirmTransaction(signature).catch(ePrint);
            await connection.getBalance(userKey, {commitment: "confirmed"}).catch(ePrint);
            return signature;
        } else {
            console.log("Begin mintTo", userKey.toBase58(), options.mint.toBase58(), amount);
            let payerOrOwner = options.payerOrOwner ?? env.wallet;
            let mint = await getMint(connection, options.mint).catch(ePrint);
            let ata = await getOrCreateAssociatedTokenAccount(connection, payerOrOwner, options.mint, userKey);
            return await token.mintTo(
                connection,
                payerOrOwner,
                options.mint,
                ata.address,
                payerOrOwner.publicKey,
                amount * Math.pow(10, mint.decimals)
            ).catch(ePrint);
        }
    }

    export async function airDrops(toUsers: Address[], options: {
        connection?: Connection,
        from?: Keypair,
        amount?: number,
        mint?: PublicKey
    }): Promise<string[]> {
        let sigs: string[] = [];
        for (let user of toUsers) {
            sigs.push(await airDrop(user, options));
        }
        return sigs;
    }

    export async function transfer(to: Address, options?: {
        connection?: Connection,
        from?: Keypair,
        amount?: number,
        mint?: PublicKey
    }): Promise<string> {
        let conn = options?.connection ?? env.defaultConnection;
        let payer = options?.from ?? env.wallet;
        let amount = options?.amount ?? 1;
        if (options?.mint == undefined) {
            const instruction = web3.SystemProgram.transfer({
                    fromPubkey: payer.publicKey,
                    toPubkey: account.toPubicKey(to),
                    lamports: web3.LAMPORTS_PER_SOL * amount
                }
            );
            let tx = new web3.Transaction().add(instruction);
            return await web3.sendAndConfirmTransaction(conn, tx, [payer]).catch(ePrint);
        } else {
            let mint = await getMint(conn, options.mint).catch(ePrint);
            let fromAccount = (await getOrCreateAssociatedTokenAccount(conn, payer, options.mint, payer.publicKey)).address;
            let toAccount = (await getOrCreateAssociatedTokenAccount(conn, payer, options.mint, account.toPubicKey(to))).address;
            return await token.transfer(conn, payer, fromAccount, toAccount, payer.publicKey, amount * Math.pow(10, mint.decimals)).catch(ePrint);
        }
    }

    export async function createAndSendV0Tx(instructions: TransactionInstruction[], signer?: Signer[],
                                            lookupTableAccount?: AddressLookupTableAccount): Promise<string> {
        const connection = env.defaultConnection;
        let latestBlockhash = await connection.getLatestBlockhash('finalized');

        const messageV0 = new TransactionMessage({
            payerKey: signer ? signer[0].publicKey : env.wallet.publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions
        }).compileToV0Message(lookupTableAccount ? [lookupTableAccount] : undefined);
        const transaction = new VersionedTransaction(messageV0);
        transaction.sign(signer ?? [env.wallet]);
        const signature = await connection.sendTransaction(transaction, {maxRetries: 5, skipPreflight: true});
        await connection.confirmTransaction({
            signature: signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        });
        return signature;
    }

    export async function createLookupTable(addresses: PublicKey[]): Promise<[PublicKey, AddressLookupTableAccount | null]> {
        const slot = await env.defaultConnection.getSlot();
        const [lookupInst, lookupAddress] =
            web3.AddressLookupTableProgram.createLookupTable({
                authority: env.wallet.publicKey,
                payer: env.wallet.publicKey,
                recentSlot: slot,
            });
        const extendTx = web3.AddressLookupTableProgram.extendLookupTable({
            payer: env.wallet.publicKey,
            authority: env.wallet.publicKey,
            lookupTable: lookupAddress,
            addresses
        });
        let signature = await createAndSendV0Tx([lookupInst, extendTx]);
        const lookupTableAccount = await env.defaultConnection.getAddressLookupTable(lookupAddress)
            .then((res) => res.value);
        console.log("signature:", signature, "lookupTableAddress:", lookupAddress.toBase58(), "lookupTableAccount:", lookupTableAccount?.key.toBase58());
        return [lookupAddress, lookupTableAccount];
    }
}