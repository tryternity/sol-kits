import {ConcurrentMerkleTreeAccount} from "@solana/spl-account-compression";
import {env} from "../dist";
import {AccountMeta, PublicKey} from "@solana/web3.js";
import {cNFT} from "../src/compressed-nft";

let collMerkelTree = new PublicKey("BTe4LBXJ1MriaS9ZAFn4nBPXHjCrZvrUS9furP3tsKEY");
let collection = "DRiP2Pn2K6fuMLKQmt5rZWyHiUZ6WK3GChEySUpHSS4x";
let RPC = "https://rpc.helius.xyz/?api-key=d4654c49-78d9-49cf-9a9f-4d5b0c9074d9";
describe('compressed nft', function () {
    it("get merkel tree data", async () => {
        const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
            env.connection("mainnet-beta"),
            collMerkelTree,
        );
        console.log(JSON.stringify(treeAccount));
    });

    it("get asset metadata", async () => {
        let assetId = "26HEsktiRbtUsfykurTNh2so1qnyffxCXLJswqATNBf6";
        let asset = await cNFT.getAsset(new PublicKey(assetId), RPC);
        console.log(JSON.stringify(asset));

    });

    it("get asset by group", async () => {
        let asset = await cNFT.getAssetsByGroup(collection, 1, 100, RPC);
        console.log(JSON.stringify(asset));
    })

    it("create Compressed Tree", async () => {
        let result = await cNFT.createCompressedTree({
            maxDepth: 14,
            maxBufferSize: 64,
        }, 5);
        console.log(JSON.stringify(result));
    })

    it("get asset proof", async () => {
        let canopyDepth = 5;
        let assetId = await cNFT.getAssertId(collMerkelTree, 207487);
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