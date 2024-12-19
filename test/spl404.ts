import {
  createSignerFromKeypair,
  keypairIdentity,
  generateSigner,
  percentAmount,
  publicKey,
  PublicKey
} from '@metaplex-foundation/umi'
import {createUmi} from '@metaplex-foundation/umi-bundle-defaults'
import {
  createV1, mintV1, mplTokenMetadata,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata'
import {env, ePrint, kits, spl_404} from "../src";
import {fromWeb3JsKeypair} from "@metaplex-foundation/umi-web3js-adapters";
import bs58 from 'bs58';
import {findAssociatedTokenPda} from "@metaplex-foundation/mpl-toolbox";
import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotent,
  createInitializeInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createUpdateFieldInstruction,
  ExtensionType,
  getMintLen,
  LENGTH_SIZE, mintTo,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE
} from "@solana/spl-token";
import {pack, TokenMetadata} from "@solana/spl-token-metadata";


const SPL_TOKEN_2022_PROGRAM_ID: PublicKey = publicKey(
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
)

describe("SPL-404 test", () => {
  beforeEach("init env", () => {
    let ENDPOINT = "https://devnet.helius-rpc.com/?api-key=1a5deb03-d4bc-4b7a-b423-58d92148c0fe";
    env.setEnv(ENDPOINT)
  })

  it("create spl-404", async () => {
    const endpoint = "https://devnet.helius-rpc.com/?api-key=1a5deb03-d4bc-4b7a-b423-58d92148c0fe";
    console.log(env.wallet.publicKey.toBase58())
    const umi = createUmi(endpoint).use(mplTokenMetadata());
    const wallet = createSignerFromKeypair(umi, fromWeb3JsKeypair(env.wallet));
    umi.use(keypairIdentity(wallet))
    const mint = generateSigner(umi)

    let ret1 = await createV1(umi, {
      mint,
      authority: umi.payer,
      name: 'My NFT',
      uri: "https://arweave.net/h9gtgOX4ga15v0CzHmmIJK1lL7KaAng2WLsTn2hwTk0",
      sellerFeeBasisPoints: percentAmount(5.5),
      splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
      tokenStandard: TokenStandard.NonFungible,
    }).sendAndConfirm(umi);
    console.log(bs58.encode(ret1.signature))

    const token = findAssociatedTokenPda(umi, {
      mint: mint.publicKey,
      owner: umi.identity.publicKey,
      tokenProgramId: SPL_TOKEN_2022_PROGRAM_ID,
    });
    let ret2 = await mintV1(umi, {
      token,
      mint: mint.publicKey,
      amount: 1,
      authority: umi.payer,
      tokenOwner: umi.payer.publicKey,
      tokenStandard: TokenStandard.NonFungible,
      splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID
    }).sendAndConfirm(umi);
    console.log(bs58.encode(ret2.signature))
  })

  it("create spl-404 test2", async () => {
    let endPoint = "https://devnet.helius-rpc.com/?api-key=1a5deb03-d4bc-4b7a-b423-58d92148c0fe";
    env.setEnv(endPoint)
    let ret = await spl_404.createMpl404({
      env: endPoint,
      nftName: "My NFT",
      metaUri: "https://arweave.net/h9gtgOX4ga15v0CzHmmIJK1lL7KaAng2WLsTn2hwTk0"
    }).catch(ePrint)
    console.log(ret.mint.toBase58(), ret.signature)
  })

  it("create spl-404 test3", async () => {
    // 1. Create Token and Mint
    const [initSig, mintSig] = await createTokenAndMint(env.defaultConnection, env.wallet);
    console.log(`Token created and minted:`);
    kits.printExplorerUrl(mintSig);
    // console.log(`   ${kits.generateExplorerUrl(initSig)}`);
    // console.log(`   ${kits.generateExplorerUrl(mintSig)}`);
  })
})

async function createTokenAndMint(connection: Connection, wallet: Keypair): Promise<[string, string]> {

  // After calculating the minimum balance for the mint account...
  let mintKeypair = Keypair.generate();
  let mint = mintKeypair.publicKey;
  const tokenMetadata: TokenMetadata = {
    updateAuthority: wallet.publicKey,
    mint: mint,
    name: 'QN Pixel',
    symbol: 'QNPIX',
    uri: "https://qn-shared.quicknode-ipfs.com/ipfs/QmQFh6WuQaWAMLsw9paLZYvTsdL5xJESzcoSxzb6ZU3Gjx",
    additionalMetadata: [["Background", "Blue"], ["WrongData", "DeleteMe!"], ["Points", "0"]],
  };
  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(tokenMetadata).length;
  const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

  let authority = wallet;
  let payer = wallet;
  let owner = wallet;
  // Prepare transaction
  const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint,
        space: mintLen,
        lamports: mintLamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMetadataPointerInstruction(
          mint,
          authority.publicKey,
          mint,
          TOKEN_2022_PROGRAM_ID,
      ),
      createInitializeMintInstruction(
          mint,
          0,
          authority.publicKey,
          null,
          TOKEN_2022_PROGRAM_ID,
      ),
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: authority.publicKey,
        mint: mint,
        mintAuthority: authority.publicKey,
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        uri: tokenMetadata.uri,
      }),
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: authority.publicKey,
        field: tokenMetadata.additionalMetadata[0][0],
        value: tokenMetadata.additionalMetadata[0][1],
      }),
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: authority.publicKey,
        field: tokenMetadata.additionalMetadata[1][0],
        value: tokenMetadata.additionalMetadata[1][1],
      }),
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: authority.publicKey,
        field: tokenMetadata.additionalMetadata[2][0],
        value: tokenMetadata.additionalMetadata[2][1],
      }),
  );
  // Initialize NFT with metadata
  const initSig = await sendAndConfirmTransaction(connection, transaction, [payer, mintKeypair, authority]);
  // Create associated token account
  const sourceAccount = await createAssociatedTokenAccountIdempotent(connection, payer, mint, owner.publicKey, {}, TOKEN_2022_PROGRAM_ID);
  // Mint NFT to associated token account
  const mintSig = await mintTo(connection, payer, mint, sourceAccount, authority, 1, [], undefined, TOKEN_2022_PROGRAM_ID);
  return [initSig, mintSig];
}