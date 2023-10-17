import {account, env, mxKit} from "../dist";

describe("metaplex1155 test", () => {
  it("create sft", async () => {
    await mxKit.createSft()
  })
  it("mint nft", async () => {
    let user1 = account.fromFile("test/ids/2KMkcs9v9EacXeiAs3dzk1nr1UH5nkSYXmUv5Gh3dvZ7.json")
    console.log(user1.publicKey.toBase58(), env.wallet.publicKey.toBase58())
    let signature = await mxKit.mintSft("A61m52df365RRHQraDDVY1SKY4WkBFwuejgio4mw7U5A",
        "2KMkcs9v9EacXeiAs3dzk1nr1UH5nkSYXmUv5Gh3dvZ7", {
          authority: env.wallet,
        })
    console.log(signature)
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
    let signature = await mxKit.burnSft("A61m52df365RRHQraDDVY1SKY4WkBFwuejgio4mw7U5A",
        {
          authority: user,
        })
    console.log(signature)
  })
})