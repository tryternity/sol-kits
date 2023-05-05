import * as anchor from "@project-serum/anchor";
import {Keypair, Transaction} from "@solana/web3.js";

export module tx {
    export function additionalComputeBudget(units: number = 400000): anchor.web3.TransactionInstruction[] {
        return [anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
            units: units
        })];
    }

    export type PartialSign = (txBase64: string) => Promise<string>;

    async function partialSignTx(mintTx: Transaction, signer: Keypair | PartialSign): Promise<Transaction> {
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
}