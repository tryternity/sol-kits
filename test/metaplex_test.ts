// noinspection DuplicatedCode

import {BigNumber, Metaplex} from "@metaplex-foundation/js";
import {account, env, ePrint, mxKit} from "../src";
import {BN} from "@coral-xyz/anchor";

describe("metaplex test", () => {
  it("create nft", async () => {
    await mxKit.createNft("CyW2wFYxPnqHaVCURVWb3LK2mAMsYfMxTXnNdbiFQy9r")
  })

  it("simulate create nft", async () => {
    let [mint, ata] = await mxKit.simulateCreateNft("CyW2wFYxPnqHaVCURVWb3LK2mAMsYfMxTXnNdbiFQy9r")
    console.log(mint.toBase58(), ata.toBase58())
  })

  it("create pNFT", async () => {
    let metaplex: Metaplex = mxKit.metaplex();
    let out = await metaplex.nfts().create({
      uri: "https://collection.mooar.com/token/solana/ad7149197b1740c7a16cfd6e4a6caaee/81",
      name: 'NFTC',
      sellerFeeBasisPoints: 200,
      tokenOwner: account.toPubicKey(env.wallet.publicKey),
      maxSupply: new BN(0) as BigNumber,
      tokenStandard: 4,
      // isCollection: true,
      // collectionIsSized: true,
      ...{},
    }).catch(ePrint);
    let signature = out.response.signature;
    console.log("sig: " + signature, "nft: " + out.nft.address.toBase58(), "ata: " + out.tokenAddress.toBase58());
    await metaplex.connection.confirmTransaction(signature).catch(ePrint);
    console.log(out.nft.address.toBase58())
  })

  it("create mutantmon", async () => {
    let metaplex: Metaplex = mxKit.metaplex();
    let out = await metaplex.nfts().create({
      uri: "https://shdw-drive.genesysgo.net/893AmBr2P9NVydpWc2TAkR3prwBtWMZH2A8RniDmduhn/1044_Light-Blue_Black.json",
      name: 'Experiment #1044',
      symbol: "MUTANT",
      sellerFeeBasisPoints: 200,
      tokenOwner: account.toPubicKey(env.wallet.publicKey),
      maxSupply: new BN(0) as BigNumber,
      tokenStandard: 4,
      // isCollection: true,
      // collectionIsSized: true,
      ...{},
    }).catch(ePrint);
    let signature = out.response.signature;
    console.log("sig: " + signature, "nft: " + out.nft.address.toBase58(), "ata: " + out.tokenAddress.toBase58());
    await metaplex.connection.confirmTransaction(signature).catch(ePrint);
    console.log(out.nft.address.toBase58())
  })
})