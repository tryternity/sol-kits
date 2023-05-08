import {account, kits} from "../dist";

describe("account test", () => {
    it("load local id.json", async () => {
        let path = kits.userHome() + "/.config/solana/id.json";
        console.log(path);
        let wallet = account.fromFile(path);
        console.log(wallet.publicKey.toBase58());

        let wallet2 = account.localWallet();
        console.log(wallet2.publicKey.toBase58());
    })
})