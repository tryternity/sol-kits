// noinspection JSUnusedGlobalSymbols

import axios from "axios";
import {
    AccountMeta,
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction
} from "@solana/web3.js";
import {
    ConcurrentMerkleTree,
    ConcurrentMerkleTreeAccount,
    createAllocTreeIx,
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
    ValidDepthSizePair
} from "@solana/spl-account-compression";
import {
    createCreateTreeInstruction,
    createMintToCollectionV1Instruction,
    createTransferInstruction,
    createUnverifyCreatorInstruction,
    getLeafAssetId,
    MetadataArgs,
    PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
} from '@metaplex-foundation/mpl-bubblegum';
import {PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,} from '@metaplex-foundation/mpl-token-metadata';
import {env} from "./env";
import BN from "bn.js";
import {TokenStandard} from "@metaplex-foundation/mpl-bubblegum/dist/src/generated/types/TokenStandard";
import {TokenProgramVersion} from "@metaplex-foundation/mpl-bubblegum/dist/src/generated/types/TokenProgramVersion";
import {ePrint} from "./kits";

export const HELIUS_RPC = "https://rpc-devnet.helius.xyz/?api-key=d4654c49-78d9-49cf-9a9f-4d5b0c9074d9";

export const META_TEST_URL = "https://arweave.net/eoKQ-WzDWzZwajfJpz8btdHteONr4BrchTG1RdZ-wGg";

export module cNFT {
    export async function treeAccount(tree: string | PublicKey, connection: Connection): Promise<ConcurrentMerkleTreeAccount> {
        return await ConcurrentMerkleTreeAccount.fromAccountAddress(
            connection ?? env.defaultConnection,
            toKey(tree),
        );
    }

    export async function getAssertId(tree: PublicKey | string, index: number): Promise<PublicKey> {
        return await getLeafAssetId(toKey(tree), new BN.BN(index));
    }

    export async function getAsset(assetId: string | PublicKey, rpcUrl = HELIUS_RPC): Promise<any> {
        return await post(rpcUrl, "getAsset", {
            id: toKey(assetId)
        });
    }

    export async function getAssetByNonce(merkleTree: PublicKey | string, nonce: number, rpcUrl = HELIUS_RPC): Promise<any> {
        let assetId = await getAssertId(merkleTree, nonce);
        return await getAsset(assetId, rpcUrl);
    }

    export async function getAssetProof(assetId: PublicKey | string, rpcUrl = HELIUS_RPC): Promise<any> {
        return await post(rpcUrl, "getAssetProof", {
            id: toKey(assetId)
        });
    }

    export async function getAssetsByOwner(
        wallet: PublicKey | string,
        page?: number,
        limit?: number,
        rpcUrl = HELIUS_RPC
    ): Promise<any> {
        return await post(rpcUrl, "getAssetsByOwner", {
            ownerAddress: toKey(wallet),
            page: page ?? 1,
            limit: limit ?? 10
        });
    }

    export async function getAssetsByGroup(collection: PublicKey | string,
                                           page?: number,
                                           limit?: number,
                                           rpcUrl = HELIUS_RPC) {
        return await post(rpcUrl, "getAssetsByGroup", {
            groupKey: "collection",
            groupValue: toKey(collection),
            page: page ?? 1,
            limit: limit ?? 10
        });
    }

    export async function createCompressedTree(maxDepthSizePair: ValidDepthSizePair,
                                               canopyDepth: number,
                                               wallet: Keypair = env.wallet,
                                               connection: Connection = env.defaultConnection) {
        connection = connection ?? env.defaultConnection;
        wallet = wallet ?? env.wallet;

        let treeKeypair = Keypair.generate();
        // derive the tree's authority (PDA), owned by Bubblegum
        const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
            [treeKeypair.publicKey.toBuffer()],
            BUBBLEGUM_PROGRAM_ID,
        );

        // allocate the tree's account on chain with the `space`
        const allocTreeIx = await createAllocTreeIx(
            connection,
            treeKeypair.publicKey,
            wallet.publicKey,
            maxDepthSizePair,
            canopyDepth,
        );

        // create the instruction to actually create the tree
        const createTreeIx = createCreateTreeInstruction(
            {
                payer: wallet.publicKey,
                treeCreator: wallet.publicKey,
                treeAuthority,
                merkleTree: treeKeypair.publicKey,
                compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                // NOTE: this is used for some on chain logging
                logWrapper: SPL_NOOP_PROGRAM_ID,
            },
            {
                maxBufferSize: maxDepthSizePair.maxBufferSize,
                maxDepth: maxDepthSizePair.maxDepth,
                public: false,
            },
            BUBBLEGUM_PROGRAM_ID,
        );

        // build the transaction
        const tx = new Transaction().add(allocTreeIx).add(createTreeIx);
        tx.feePayer = wallet.publicKey;

        // send the transaction
        const txSignature = await sendAndConfirmTransaction(
            connection, tx,
            // ensuring the `treeKeypair` PDA and the `payer` are BOTH signers
            [treeKeypair, wallet],
            {
                commitment: "confirmed",
                skipPreflight: true,
            },
        );
        return {signature: txSignature, treeKey: treeKeypair.publicKey}
    }

    export async function createCompressedNFT(
        collection: PublicKey | string,
        merkleTree: PublicKey | string,
        metadata: MetadataArgs = {
            name: "ANY",
            symbol: "ANY",
            uri: META_TEST_URL,
            sellerFeeBasisPoints: 200,
            creators: [],
            editionNonce: 0,
            uses: null,
            collection: null,
            primarySaleHappened: false,
            isMutable: false,
            tokenProgramVersion: TokenProgramVersion.Original,
            tokenStandard: TokenStandard.NonFungible,
        },
        wallet: Keypair = env.wallet,
        connection: Connection = env.defaultConnection
    ) {
        connection = connection ?? env.defaultConnection;
        wallet = wallet ?? env.wallet;
        let collectionMint = toKey(collection);
        let treeKey = toKey(merkleTree);
        // derive a PDA (owned by Bubblegum) to act as the (signer) of the compressed minting
        const [bubblegumSigner, _bump2] = PublicKey.findProgramAddressSync(
            // `collection_cpi` is a custom prefix required by the Bubblegum program
            [Buffer.from("collection_cpi", "utf8")],
            BUBBLEGUM_PROGRAM_ID,
        );

        // derive the tree's authority (PDA), owned by Bubblegum
        const [treeAuthority, _bump] = PublicKey.findProgramAddressSync([treeKey.toBuffer()], BUBBLEGUM_PROGRAM_ID);
        const [collectionMetadataAccount, _b1] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata", "utf8"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                collectionMint.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        );
        const [collectionEditionAccount, _b2] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata", "utf8"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                collectionMint.toBuffer(),
                Buffer.from("edition", "utf8"),
            ],
            TOKEN_METADATA_PROGRAM_ID
        );
        const compressedMintIx = createMintToCollectionV1Instruction(
            {
                payer: wallet.publicKey,
                merkleTree: treeKey,
                treeAuthority,
                treeDelegate: wallet.publicKey,

                // set the receiver of the NFT
                leafOwner: wallet.publicKey,
                // set a delegated authority over this NFT
                leafDelegate: wallet.publicKey,

                // collection details
                collectionAuthority: wallet.publicKey,
                collectionAuthorityRecordPda: BUBBLEGUM_PROGRAM_ID,
                collectionMint: collectionMint,
                collectionMetadata: collectionMetadataAccount,
                editionAccount: collectionEditionAccount,

                // other accounts
                bubblegumSigner: bubblegumSigner,
                compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                logWrapper: SPL_NOOP_PROGRAM_ID,
                tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            },
            {
                metadataArgs: Object.assign(metadata, {
                    collection: {key: collectionMint, verified: false},
                }),
            }
        );
        const tx = new Transaction().add(compressedMintIx);
        tx.feePayer = wallet.publicKey;

        // send the transaction to the cluster
        let txSignature = await sendAndConfirmTransaction(connection, tx, [wallet], {
            commitment: "confirmed",
            skipPreflight: true,
        }).catch(ePrint);
        let treeAccount: ConcurrentMerkleTree = (await ConcurrentMerkleTreeAccount.fromAccountAddress(connection, treeKey).catch(ePrint)).tree;
        treeAccount.changeLogs = [];
        return {
            "signature": txSignature,
            "sequenceNumber": treeAccount.sequenceNumber,
            "activeIndex": treeAccount.activeIndex,
            "bufferSize": treeAccount.bufferSize,
            "rightMostPath": treeAccount.rightMostPath
        }
    }

    export async function unverified(merkleTree: PublicKey | string,
                                     nonce: number,
                                     wallet: Keypair = env.wallet,
                                     connection: Connection = env.defaultConnection,
                                     rpcUrl = HELIUS_RPC) {
        connection = connection ?? env.defaultConnection;
        wallet = wallet ?? env.wallet;
        // let collectionMint = toKey(collection);
        let treeKey = toKey(merkleTree);
        const [treeAuthority, _bump] = PublicKey.findProgramAddressSync([treeKey.toBuffer()], BUBBLEGUM_PROGRAM_ID);

        let assetId = await getAssertId(treeKey, nonce);
        let asset = await getAsset(assetId, rpcUrl);
        let assetProof = await getAssetProof(assetId, rpcUrl)
        let message = {
            name: asset.name,
            symbol: asset.symbol,
            uri: asset.uri,
            sellerFeeBasisPoints: asset.sellerFeeBasisPoints,
            primarySaleHappened: asset.primarySaleHappened,
            isMutable: asset.isMutable,
            tokenStandard: asset.tokenStandard,
            tokenProgramVersion: asset.tokenProgramVersion,
            editionNonce: null,
            collection: null,
            uses: asset.uses,
            creators: asset.creators
        } as MetadataArgs;
        let ix = createUnverifyCreatorInstruction({
            creator: asset.creator,
            leafDelegate: asset.leafDelegate,
            leafOwner: asset.leafOwner,
            merkleTree: treeKey,
            payer: wallet.publicKey,
            treeAuthority,
            logWrapper: SPL_NOOP_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
            anchorRemainingAccounts: [],
        }, {
            root: [...new PublicKey(assetProof.root.trim()).toBytes()],
            dataHash: [...new PublicKey(asset.compression.data_hash.trim()).toBytes()],
            creatorHash: [
                ...new PublicKey(asset.compression.creator_hash.trim()).toBytes(),
            ],
            nonce: asset.compression.leaf_id,
            index: asset.compression.leaf_id,
            message,
        });
        const tx = new Transaction().add(ix);
        tx.feePayer = wallet.publicKey;
        return await sendAndConfirmTransaction(connection, tx, [wallet], {
            commitment: "confirmed",
            skipPreflight: true,
        });
    }

    export async function transferCompressedNFT(
        merkleTree: PublicKey | string,
        assetId: PublicKey | string | number,
        to: PublicKey | string,
        wallet: Keypair = env.wallet,
        connection: Connection = env.defaultConnection,
        rpcUrl = HELIUS_RPC
    ) {
        connection = connection ?? env.defaultConnection;
        wallet = wallet ?? env.wallet;
        let treeKey = toKey(merkleTree);
        // retrieve the merkle tree's account from the blockchain
        const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(connection, treeKey);

        // extract the needed values for our transfer instruction
        const treeAuthority = treeAccount.getAuthority();
        const canopyDepth = treeAccount.getCanopyDepth();
        assetId = typeof assetId == 'number' ? await getAssertId(treeKey, assetId) : toKey(assetId);
        console.log("treeAuthority:", treeAuthority.toBase58(), "canopyDepth:", canopyDepth, "assetId:", assetId.toBase58())
        let asset = await getAsset(assetId, rpcUrl);
        let assetProof = await getAssetProof(assetId, rpcUrl)
        // parse the list of proof addresses into a valid AccountMeta[]
        const proof: AccountMeta[] = assetProof.proof
            .slice(0, assetProof.proof.length - (!!canopyDepth ? canopyDepth : 0))
            .map((node: string) => ({
                pubkey: new PublicKey(node),
                isSigner: false,
                isWritable: false,
            }));

        // create the NFT transfer instruction (via the Bubblegum package)
        const transferIx = createTransferInstruction(
            {
                merkleTree: treeKey,
                treeAuthority,
                leafOwner: wallet.publicKey,
                leafDelegate: wallet.publicKey,
                newLeafOwner: toKey(to),
                logWrapper: SPL_NOOP_PROGRAM_ID,
                compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                anchorRemainingAccounts: proof,
            },
            {
                root: [...new PublicKey(assetProof.root.trim()).toBytes()],
                dataHash: [...new PublicKey(asset.compression.data_hash.trim()).toBytes()],
                creatorHash: [
                    ...new PublicKey(asset.compression.creator_hash.trim()).toBytes(),
                ],
                nonce: asset.compression.leaf_id,
                index: asset.compression.leaf_id,
            },
            BUBBLEGUM_PROGRAM_ID,
        );
        // send the transaction to the cluster
        const tx = new Transaction().add(transferIx);
        tx.feePayer = wallet.publicKey;
        return await sendAndConfirmTransaction(env.defaultConnection, tx, [wallet], {
            commitment: "confirmed",
            skipPreflight: true,
        });
    }
}

function toKey(key: PublicKey | string): PublicKey {
    return key instanceof PublicKey ? key : new PublicKey(key);
}

async function post(url: string, method: string, params: any) {
    try {
        const axiosInstance = axios.create({
            baseURL: url,
        });
        const response = await axiosInstance.post(url, {
            jsonrpc: "2.0",
            id: "rpd-op-123",
            method,
            params: params,
        }).catch(ePrint);
        return response.data.result;
    } catch (error) {
        console.error(error);
        throw error;
    }
}