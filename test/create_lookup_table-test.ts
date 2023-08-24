import {tx} from "../dist";
import {Keypair} from "@solana/web3.js";

describe('create lookup table', function () {
    it("create lookup table", async () => {
        await tx.createLookupTable([
            Keypair.generate().publicKey,
            Keypair.generate().publicKey
        ]);
    });
})