// noinspection JSUnusedGlobalSymbols

import * as anchor from "@coral-xyz/anchor";
import {web3} from "@coral-xyz/anchor";
import {
  AddressLookupTableAccount,
  Keypair,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";
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

  export async function createAndSendV0Tx1(instructions: TransactionInstruction[], signer?: Signer[],
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
    const signature = await connection.sendTransaction(transaction, {
      maxRetries: 5,
      skipPreflight: true
    });
    await connection.confirmTransaction({
      signature: signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    });
    return signature;
  }

  export async function createAndSendV0Tx2(instructions: TransactionInstruction[], signer?: Signer[],
                                           lookupTableAddress?: (PublicKey | string)[]): Promise<string> {
    let lookupTableAccount: AddressLookupTableAccount | null = null;
    if (lookupTableAddress) {
      let [_, table] = await createLookupTable(lookupTableAddress);
      lookupTableAccount = table;
    }
    return await createAndSendV0Tx1(instructions, signer, lookupTableAccount == null ? undefined : lookupTableAccount);
  }

  export async function createLookupTable(addresses: (PublicKey | string)[]): Promise<[PublicKey, AddressLookupTableAccount | null]> {
    const slot = await env.defaultConnection.getSlot();
    const [lookupInst, lookupAddress] =
        web3.AddressLookupTableProgram.createLookupTable({
          authority: env.wallet.publicKey,
          payer: env.wallet.publicKey,
          recentSlot: slot,
        });
    let addresses2 = addresses.map((address) => {
      return address instanceof PublicKey ? address : new PublicKey(address);
    })
    const extendTx = web3.AddressLookupTableProgram.extendLookupTable({
      payer: env.wallet.publicKey,
      authority: env.wallet.publicKey,
      lookupTable: lookupAddress,
      addresses: addresses2
    });
    let signature = await createAndSendV0Tx1([lookupInst, extendTx]);
    const lookupTableAccount = await env.defaultConnection.getAddressLookupTable(lookupAddress)
    .then((res) => res.value);
    console.log("signature:", signature, "lookupTableAddress:", lookupAddress.toBase58(), "lookupTableAccount:", lookupTableAccount?.key.toBase58());
    return [lookupAddress, lookupTableAccount];
  }
}