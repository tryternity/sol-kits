import {env} from "./env";
import {createFungible, mplTokenMetadata,} from '@metaplex-foundation/mpl-token-metadata'
import {
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount
} from "@metaplex-foundation/umi";
import {ePrint, kits} from "./kits";
import * as token from "@solana/spl-token";
import {
  createAssociatedTokenAccountIdempotent,
  createInitializeInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createUpdateFieldInstruction,
  ExtensionType,
  getAssociatedTokenAddressSync,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  LENGTH_SIZE,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import bs58 from "bs58";
import {pack, TokenMetadata} from "@solana/spl-token-metadata";
import {createUmi} from "@metaplex-foundation/umi-bundle-defaults";
import {fromWeb3JsKeypair, fromWeb3JsPublicKey} from "@metaplex-foundation/umi-web3js-adapters";

export module spl_404 {
  export type Metadata = {
    name?: string,
    symbol?: string,
    uri?: string,
    additionalMetadata?: (readonly [string, string])[]
  };

  export async function transfer(mint: PublicKey, src: Keypair, dst: PublicKey, amount: number = 1): Promise<string> {
    let srcAta = getAssociatedTokenAddressSync(mint, src.publicKey, true, TOKEN_2022_PROGRAM_ID)
    kits.printExplorerUrl(srcAta)
    let dstAta = await getOrCreateAssociatedTokenAccount(env.defaultConnection, src, mint, dst, true, undefined, undefined, TOKEN_2022_PROGRAM_ID)
    kits.printExplorerUrl(dstAta.address)
    let sig = await token.transfer(env.defaultConnection,
        env.wallet, srcAta, dstAta.address, src, amount, [], undefined, TOKEN_2022_PROGRAM_ID).catch(ePrint);
    kits.printExplorerUrl(sig)
    return sig;
  }

  // see https://www.quicknode.com/guides/solana-development/spl-tokens/token-2022/nft
  export async function createSpl404AndMint(wallet: Keypair, amount: number = 1, meta?: Metadata): Promise<PublicKey> {
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
    const mintSig = await mintTo(env.defaultConnection, payer, mint, sourceAccount, authority, amount, [], undefined, TOKEN_2022_PROGRAM_ID);
    console.log("mint:" + mint.toBase58());
    kits.printExplorerUrl(initSig);
    kits.printExplorerUrl(mintSig);
    return mint
  }

  // see https://developers.metaplex.com/guides/javascript/how-to-create-a-solana-token
  export async function createMpl404(wallet: Keypair, amount: number = 1, meta?: Metadata): Promise<PublicKey> {
    const umi = createUmi(env.defaultConnection.rpcEndpoint).use(mplTokenMetadata());
    const keypair = createSignerFromKeypair(umi, fromWeb3JsKeypair(wallet));
    umi.use(keypairIdentity(keypair))

    const mintSigner = generateSigner(umi);
    let tokenProgram = TOKEN_2022_PROGRAM_ID;
    let createTx = await createFungible(umi, {
      mint: mintSigner,
      authority: env.toUmiSigner(wallet),
      name: meta?.name ?? 'QN Pixel',
      symbol: meta?.symbol ?? 'QNPIX',
      uri: meta?.uri ?? "https://qn-shared.quicknode-ipfs.com/ipfs/QmQFh6WuQaWAMLsw9paLZYvTsdL5xJESzcoSxzb6ZU3Gjx",
      splTokenProgram: fromWeb3JsPublicKey(tokenProgram),
      sellerFeeBasisPoints: percentAmount(0),
      decimals: 0
    }).sendAndConfirm(umi).catch(ePrint)
    let initSig = bs58.encode(createTx.signature);
    let _mint = new PublicKey(mintSigner.publicKey.toString());
    kits.printExplorerUrl(_mint.toBase58());
    kits.printExplorerUrl(initSig)

    let ata = await getOrCreateAssociatedTokenAccount(env.defaultConnection, wallet, _mint, wallet.publicKey, true, undefined, undefined, tokenProgram)
    kits.printExplorerUrl(ata.address.toBase58());

    let mintSig = await mintTo(env.defaultConnection, wallet, _mint, ata.address, wallet, amount, [], undefined, tokenProgram)
    kits.printExplorerUrl(mintSig)
    return _mint
  }
}