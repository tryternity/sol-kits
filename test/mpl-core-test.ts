import {env, kits, mpl_core} from "../src";
import {PublicKey} from "@solana/web3.js";

describe("mpl core test", () => {
  beforeEach("init env", () => {
    let ENDPOINT = "https://devnet.helius-rpc.com/?api-key=1a5deb03-d4bc-4b7a-b423-58d92148c0fe";
    env.setEnv(ENDPOINT)
  })

  it("create core", async () => {
    let collection = await mpl_core.createCollection()
    await mpl_core.createCore(collection)
  })

  it("core data", async () => {
    let data = await mpl_core.data(new PublicKey("93cydHvHkL2J8ViFXPfTeEKk4zj2cbtfzQs6mrpDoQkq"));
    console.log(kits.toJson(data))
  })
})