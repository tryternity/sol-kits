import {env} from "../dist";
import {Keypair} from "@solana/web3.js";

describe("env test", () => {
    it("env test", async () => {
        let conn = env.setEnv("devnet", Keypair.generate());
    })
})