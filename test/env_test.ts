import {env} from "../dist";
import {Keypair} from "@solana/web3.js";
import {Env, account} from "../dist";

describe("env test", () => {
  it("env test", async () => {
    let a = account.localWallet();
    console.log(a.publicKey.toBase58(), env.wallet.publicKey.toBase58())
    env.setEnv(Env.devnet, Keypair.generate());
  })
})