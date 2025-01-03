import {env, ePrint, spl_404} from "../src";
import {PublicKey} from "@solana/web3.js";

describe("SPL-404 test", () => {
  beforeEach("init env", () => {
    let ENDPOINT = "https://devnet.helius-rpc.com/?api-key=1a5deb03-d4bc-4b7a-b423-58d92148c0fe";
    env.setEnv(ENDPOINT)
  })

  it("create mpl-404", async () => {
    await spl_404.createMpl404(env.wallet, 1, {
      uri: "https://arweave.net/h9gtgOX4ga15v0CzHmmIJK1lL7KaAng2WLsTn2hwTk0"
    }).catch(ePrint)
  })

  it("create spl-404", async () => {
    await spl_404.createSpl404AndMint(env.wallet).catch(ePrint);
  })

  it("transfer spl 404", async () => {
    await spl_404.transfer(new PublicKey("DwEsUAF4fbbbFoNwwEtLfen3YPgtmSs5qwTda8axG61f"),
        env.wallet,
        new PublicKey("9nAnJiUWz25VeXLDimwAxSYDPE4vPZjnCTJ3jMbQuMFs"))
  })
})

