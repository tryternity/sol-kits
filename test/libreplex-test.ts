import {mintSingle, setupCollection} from "@libreplex/sdk";
import * as anchor from "@coral-xyz/anchor";
import {PublicKey} from "@solana/web3.js";
import {Env, env} from "../src";

process.env.ANCHOR_WALLET = "/Users/user/.config/solana/id.json";
process.env.ANCHOR_PROVIDER_URL = env.cluster(Env.devnet);

describe("libreplex test", () => {
  it("libreplex test", async () => {
    const provider = anchor.AnchorProvider.local(env.cluster(Env.devnet))
    const {method, mint} = (await mintSingle({
      provider,
      mintData: {
        assetUrl: {
          type: "jsonUrl",
          value: "COOL.com"
        },
        name: "COOL",
        symbol: "COOL",
      }
    }))
    let signature = await method.rpc()
    console.log(mint.publicKey.toBase58(), signature)
  })

  it("Creating a collection/group", async () => {
    const provider = anchor.AnchorProvider.local(env.cluster(Env.devnet))
    const {method, collection} = await setupCollection({
      collectionAuthority: new PublicKey("5y4FAgHyy9NHBj1CE2zZTXDH4Bpip1KSMkYBNngJw6Ch"),
      connector: {
        type: "provider",
        provider,
      },
      input: {
        description: "A very cool group",
        name: "COOLIO",
        symbol: "GRP",
        url: "COOL.com",
        royalties: {
          bps: 0,
          shares: [{
            recipient: new PublicKey("5y4FAgHyy9NHBj1CE2zZTXDH4Bpip1KSMkYBNngJw6Ch"),
            share: 100,
          }],
        },
        permittedSigners: [],
        onChainAttributes: [],
      }
    })

    let signature = await method.rpc()
    console.log(collection.toBase58(), signature)
  })

  it("Minting to a collection.", async () => {
    const provider = anchor.AnchorProvider.env()

    const collection = new PublicKey("DkLGLMeSL6w7kYJRdhZTPgbyj52S3AZKVhFEhVw1npSU");
    const {method, mint} = (await mintSingle({
      provider,
      mintData: {
        assetUrl: {
          type: "jsonUrl",
          value: "COOL.com"
        },
        name: "COOL",
        symbol: "COOL",
      },
      mintToCollection: {
        collection,
        checkValidGroup: false,
      }
    }))
    let signature = await method.rpc()
    console.log(signature, mint.publicKey.toBase58())
  })
})