import {env, kits, mxKit} from "../dist";
import {AccountMeta, PublicKey} from "@solana/web3.js";
import {cNFT, META_TEST_URL} from "../dist/compressed-nft";
import * as fs from "fs";
import {ConcurrentMerkleTreeAccount} from "@solana/spl-account-compression";
import {
    createUnverifyCreatorInstruction
} from "@metaplex-foundation/mpl-bubblegum/dist/src/generated/instructions/unverifyCreator";

let merkelTree = new PublicKey("BTe4LBXJ1MriaS9ZAFn4nBPXHjCrZvrUS9furP3tsKEY");
let collection = "DRiP2Pn2K6fuMLKQmt5rZWyHiUZ6WK3GChEySUpHSS4x";
let RPC = "https://rpc.helius.xyz/?api-key=d4654c49-78d9-49cf-9a9f-4d5b0c9074d9";
describe('compressed nft', function () {
    it("getAssertId", async () => {
        let assetId1 = await cNFT.getAssertId(merkelTree, 1);
        console.log(assetId1.toBase58());

        let assetId2 = await cNFT.getAssertId(merkelTree, 207487);
        console.log(assetId2.toBase58());
    })

    it("getAssetByNonce", async () => {
        let meta = await cNFT.getAssetByNonce(merkelTree, 1, RPC);
        console.log(JSON.stringify(meta));
    })

    it("get merkel tree data", async () => {
        let tree = await cNFT.treeAccount(merkelTree, env.connection("mainnet-beta"));
        console.log(JSON.stringify(tree));
    });

    it("Merge merkel tree account data", async () => {
        let data = fs.readFileSync("./test/account-data.txt", "utf-8");
        let buff = kits.base64ToUint8Array(data);
        let account = ConcurrentMerkleTreeAccount.fromBuffer(new Buffer(buff))

        console.log("===========")
        console.log(kits.toJson(account));
    })

    it("get asset metadata", async () => {
        let assetId = "26HEsktiRbtUsfykurTNh2so1qnyffxCXLJswqATNBf6";
        let asset = await cNFT.getAsset(new PublicKey(assetId), RPC);
        console.log(JSON.stringify(asset));

    });

    it("get asset by group", async () => {
        let asset = await cNFT.getAssetsByGroup(collection, 1, 100, RPC);
        console.log(JSON.stringify(asset));
    })

    it("create&transfer Compressed Tree", async () => {
        let out = await mxKit.createNFT(env.wallet, {
            name: "TTT", sellerFeeBasisPoints: 200, uri: META_TEST_URL,
            isCollection: true,
            collectionIsSized: true
        });
        let tree = await cNFT.createCompressedTree({
            maxDepth: 14,
            maxBufferSize: 64,
        }, 5);
        // console.log(JSON.stringify(tree));
        let create = await cNFT.createCompressedNFT(out.nft.address, tree.treeKey);
        // console.log("NFT1", JSON.stringify(create));
        let meta1 = await cNFT.getAssetByNonce(tree.treeKey, 0);
        console.log(JSON.stringify(meta1));

        let create2 = await cNFT.createCompressedNFT(out.nft.address, tree.treeKey);
        // console.log("NFT2", JSON.stringify(create2));
        let meta2 = await cNFT.getAssetByNonce(tree.treeKey, 1);
        console.log(JSON.stringify(meta2));


        let transfer = await cNFT.transferCompressedNFT(tree.treeKey, 0, "DxNoG8jDPPhYtgxCJM8xjjm2UBZYdu44T1sfCvxjTiNa");
        console.log(JSON.stringify(transfer));
    })

    it("get asset proof", async () => {
        let canopyDepth = 5;
        let assetId = await cNFT.getAssertId(merkelTree, 207487);
        console.log(assetId.toBase58());
        let asset = await cNFT.getAsset(assetId, RPC);
        console.log(JSON.stringify(asset));
        let assetProof = await cNFT.getAssetProof(assetId, RPC)
        console.log(JSON.stringify(assetProof));
        // parse the list of proof addresses into a valid AccountMeta[]
        const proof: AccountMeta[] = assetProof.proof
            .slice(0, assetProof.proof.length - (!!canopyDepth ? canopyDepth : 0))
            .map((node: string) => ({
                pubkey: new PublicKey(node),
                isSigner: false,
                isWritable: false,
            }));
        console.log(JSON.stringify(proof))
    });
});