import {BigNumber, Metaplex} from "@metaplex-foundation/js";
import {account, env, ePrint, mx} from "../dist";
import {BN} from "@project-serum/anchor";

describe("metaplex test", () => {
    it("create nft", async () => {
        await mx.createNFT("CyW2wFYxPnqHaVCURVWb3LK2mAMsYfMxTXnNdbiFQy9r")
    })

    it("simulate create nft", async () => {
        let [mint, ata] = await mx.simulateCreateNft("CyW2wFYxPnqHaVCURVWb3LK2mAMsYfMxTXnNdbiFQy9r")
        console.log(mint.toBase58(), ata.toBase58())
    })

    it("create pNFT", async () => {
        let metaplex: Metaplex = await mx.metaplex();
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
})