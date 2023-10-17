import {BigNumber, Metaplex} from "@metaplex-foundation/js";
import {account, env, ePrint, mxKit, tx} from "../dist";
import {BN} from "@project-serum/anchor";
import {PublicKey} from "@solana/web3.js";
import {TokenStandard} from "@metaplex-foundation/mpl-token-metadata";

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
})