// noinspection JSUnusedGlobalSymbols

import {web3} from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";
import {ePrint} from "./kits";
import * as token from "@solana/spl-token";
import {
  createBurnCheckedInstruction,
  getMint,
  getOrCreateAssociatedTokenAccount
} from "@solana/spl-token";
import {account, Address} from "./account";
import {env} from "./env";

export module tokenX {
  import toPubicKey = account.toPubicKey;

  export async function create(options?: {
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
    from?: Keypair,
    amount?: number,
    mint?: PublicKey
  }): Promise<string> {
    let connection = options?.connection ?? env.defaultConnection;
    let amount = options?.amount ?? 1;
    let userKey = account.toPubicKey(user);
    if (options?.mint == undefined) {
      let latestBlockhash = await connection.getLatestBlockhash('finalized');
      const signature = await connection.requestAirdrop(userKey, web3.LAMPORTS_PER_SOL * amount).catch(ePrint);
      await connection.confirmTransaction({
        signature: signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }).catch(ePrint);
      await connection.getBalance(userKey, {commitment: "confirmed"}).catch(ePrint);
      return signature;
    } else {
      console.log("Begin mintTo", userKey.toBase58(), options.mint.toBase58(), amount);
      let payerOrOwner = options.from ?? env.wallet;
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
    mint?: PublicKey | string
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
      let mint = await getMint(conn, toPubicKey(options.mint)).catch(ePrint);
      let fromAccount = (await getOrCreateAssociatedTokenAccount(conn, payer, mint.address, payer.publicKey)).address;
      let toAccount = (await getOrCreateAssociatedTokenAccount(conn, payer, mint.address, account.toPubicKey(to))).address;
      return await token.transfer(conn, payer, fromAccount, toAccount, payer.publicKey, amount * Math.pow(10, mint.decimals)).catch(ePrint);
    }
  }

  export async function burn(mint: Address, options?: {
    amount?: number,
    owner?: PublicKey | string
    authority?: Keypair,
  }) {
    let authority = toPubicKey(options?.authority ?? env.wallet);
    let owner = toPubicKey(options?.owner ?? authority);
    let ata = token.getAssociatedTokenAddressSync(toPubicKey(mint), owner);
    const burnIx = createBurnCheckedInstruction(
        ata, toPubicKey(mint), owner, options?.amount ?? 1, 0
    );
    let latestBlockhash = await env.defaultConnection.getLatestBlockhash('finalized');
    const messageV0 = new TransactionMessage({
      payerKey: authority,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [burnIx]
    }).compileToV0Message();
    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([options?.authority ?? env.wallet])
    const signature = await env.defaultConnection.sendTransaction(transaction).catch(ePrint);
    await env.defaultConnection.confirmTransaction({
      signature: signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    });
    return signature;
  }
}