import {env, Env} from "./env";
import {createV1, mplTokenMetadata, TokenStandard} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  percentAmount
} from "@metaplex-foundation/umi";
import {ePrint, kits} from "./kits";
import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  createAssociatedTokenAccountIdempotent,
  createInitializeInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createUpdateFieldInstruction,
  ExtensionType,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  LENGTH_SIZE,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE
} from "@solana/spl-token";
import {pack, TokenMetadata} from "@solana/spl-token-metadata";

export module spl_404 {
  export type Metadata = {
    name?: string,
    symbol?: string,
    uri?: string,
    additionalMetadata?: (readonly [string, string])[]
  };
  export type Spl404Ret = {
    mint: PublicKey,
    initSig: string,
    mintSig: string
  }

  export async function createTokenAndMint(wallet: Keypair, meta?: Metadata): Promise<Spl404Ret> {
    // After calculating the minimum balance for the mint account...
    let mintKeypair = Keypair.generate();
    let mint = mintKeypair.publicKey;
    let authority = wallet;
    let payer = wallet;
    let owner = wallet;

    const tokenMetadata: TokenMetadata = {
      updateAuthority: authority.publicKey,
      mint: mint,
      name: meta?.name ?? 'QN Pixel',
      symbol: meta?.symbol ?? 'QNPIX',
      uri: meta?.uri ?? "https://qn-shared.quicknode-ipfs.com/ipfs/QmQFh6WuQaWAMLsw9paLZYvTsdL5xJESzcoSxzb6ZU3Gjx",
      additionalMetadata: meta?.additionalMetadata ?? [["Background", "Blue"], ["WrongData", "DeleteMe!"], ["Points", "0"]],
    };
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(tokenMetadata).length;
    const mintLamports = await env.defaultConnection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

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
    const initSig = await sendAndConfirmTransaction(env.defaultConnection, transaction, [payer, mintKeypair, authority]);
    // Create associated token account
    const sourceAccount = await createAssociatedTokenAccountIdempotent(env.defaultConnection, payer, mint, owner.publicKey, {}, TOKEN_2022_PROGRAM_ID);
    // Mint NFT to associated token account
    const mintSig = await mintTo(env.defaultConnection, payer, mint, sourceAccount, authority, 1, [], undefined, TOKEN_2022_PROGRAM_ID);
    console.log("mint:" + mint.toBase58());
    kits.printExplorerUrl(initSig);
    kits.printExplorerUrl(mintSig);
    return {mint, initSig, mintSig}
  }

  export async function createMpl404(arg: {
    env?: Env | string
    nftName: string,
    metaUri: string
  }) {
    const umi = env.umi(arg.env).use(mplTokenMetadata())
    let mint = generateSigner(umi)
    let ret = await createV1(umi, {
      mint,
      authority: env.toUmiSigner(env.wallet),
      name: arg.nftName,
      uri: arg.metaUri,
      sellerFeeBasisPoints: percentAmount(5.5),
      splTokenProgram: env.SPL_TOKEN_2022_PROGRAM_ID,
      tokenStandard: TokenStandard.NonFungible,
    }).sendAndConfirm(umi).catch(ePrint);

    let _mint = new PublicKey(mint.publicKey.toString());
    console.log("mint", mint.publicKey.toString(), bs58.encode(ret.signature));
    let ata = await getOrCreateAssociatedTokenAccount(
        env.defaultConnection,
        env.wallet,
        _mint,
        env.wallet.publicKey,
        true,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID,
        undefined).catch(ePrint);
    console.log("ata:", ata);
    let initSig = bs58.encode(ret.signature);
    let mintSig = await mintTo(env.defaultConnection, env.wallet, _mint, ata.address, env.wallet, 1, [], undefined, TOKEN_2022_PROGRAM_ID).catch(ePrint);
    return {
      mint: _mint,
      signature: [initSig, mintSig],
    }
  }
}