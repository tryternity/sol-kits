import {account, env, mxKit, tokenX} from "../src";

describe("metaplex1155 test", () => {
  it("create sft", async () => {
    await mxKit.createSft()
  })
  it("mint nft", async () => {
    let user1 = account.fromFile("test/ids/2KMkcs9v9EacXeiAs3dzk1nr1UH5nkSYXmUv5Gh3dvZ7.json")
    console.log(user1.publicKey.toBase58(), env.wallet.publicKey.toBase58())
    let sig1 = await mxKit.mintSft("A61m52df365RRHQraDDVY1SKY4WkBFwuejgio4mw7U5A",
        user1.publicKey, {
          authority: env.wallet,
        })
    console.log(sig1)
    let user2 = account.fromFile("test/ids/DwL8FteSG95TepjUqfPTbywuMjGiQgUMRgpvcDMznnTH.json")
    let sig2 = await tokenX.transfer(user2.publicKey, {
      mint: "A61m52df365RRHQraDDVY1SKY4WkBFwuejgio4mw7U5A",
      from: user1,
      amount: 2
    })
    console.log(sig2)
  })
  it("mint sft2", async () => {
    let signature = await mxKit.mintSft("A61m52df365RRHQraDDVY1SKY4WkBFwuejgio4mw7U5A",
        "DwL8FteSG95TepjUqfPTbywuMjGiQgUMRgpvcDMznnTH", {
          authority: env.wallet,
        })
    console.log(signature)
  })

  it("burn sft2", async () => {
    let user = account.fromFile("test/ids/2KMkcs9v9EacXeiAs3dzk1nr1UH5nkSYXmUv5Gh3dvZ7.json")
    let signature = await tokenX.burn("A61m52df365RRHQraDDVY1SKY4WkBFwuejgio4mw7U5A",
        {
          authority: user,
        })
    console.log(signature)
  })
});