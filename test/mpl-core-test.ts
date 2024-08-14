import {env, kits, mpl_core} from "../src";

describe("mpl core test", () => {
  it("create core", async () => {
    env.setEnv("https://devnet.helius-rpc.com/?api-key=1a5deb03-d4bc-4b7a-b423-58d92148c0fe");
    let [collection, sig1] = await mpl_core.createCollection({
      name: "CoreCollection",
      uri: "https://arweave.net/-UUOtLiB4db50w5QWxhHVNUKbAAEfzGXtIbcY2VRJ5A"
    })
    console.log(sig1, collection.toBase58())
    let [asset, sig2] = await mpl_core.createCore({
      name: "CoreNFT",
      uri: "https://arweave.net/-UUOtLiB4db50w5QWxhHVNUKbAAEfzGXtIbcY2VRJ5A"
    }, collection)
    console.log(sig2, asset.toBase58())
    let data = await mpl_core.data(asset);
    console.log(kits.toJson(data))
  })
})