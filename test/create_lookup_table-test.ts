import {env, tx} from "../dist";

describe('create lookup table', function () {
    it("create lookup table", async () => {
        await tx.createLookupTable([
            env.wallet.publicKey
        ]);
    });
})