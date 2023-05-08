import {mx} from "../dist";

describe("metaplex test", () => {
    it("create nft", async () => {
        await mx.createNFT("CyW2wFYxPnqHaVCURVWb3LK2mAMsYfMxTXnNdbiFQy9r")
    })

    it("simulate create nft", async () => {
        let [mint, ata] = await mx.simulateCreateNft("CyW2wFYxPnqHaVCURVWb3LK2mAMsYfMxTXnNdbiFQy9r")
        console.log(mint.toBase58(), ata.toBase58())
    })
})