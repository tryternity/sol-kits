import {
  createSignerFromKeypair,
  keypairIdentity,
  generateSigner,
  percentAmount,
  publicKey,
  PublicKey, signerIdentity,
} from '@metaplex-foundation/umi'
import {createUmi} from '@metaplex-foundation/umi-bundle-defaults'
import {
  createV1, mintV1, mplTokenMetadata,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata'
import {env, tokenX} from "../dist";
import {fromWeb3JsKeypair} from "@metaplex-foundation/umi-web3js-adapters";
import {clusterApiUrl} from "@solana/web3.js";
import bs58 from 'bs58';
import {findAssociatedTokenPda} from "@metaplex-foundation/mpl-toolbox";


const SPL_TOKEN_2022_PROGRAM_ID: PublicKey = publicKey(
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
)

describe("SPL-404 test", () => {
  it("create spl-404", async () => {
    const endpoint = clusterApiUrl('devnet');
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
      mint: mint.publicKey,
      amount: 1,
      authority: umi.payer,
      tokenOwner: umi.payer.publicKey,
      tokenStandard: TokenStandard.NonFungible,
    }).sendAndConfirm(umi);
    console.log(bs58.encode(ret2.signature))
  })

  it("create spl-404 test2", async () => {
    let ret = await tokenX.mintSPL404({
      nftName: "My NFT",
      metaUri: "https://arweave.net/h9gtgOX4ga15v0CzHmmIJK1lL7KaAng2WLsTn2hwTk0"
    })
    console.log(ret.mint.toBase58(), ret.signature)
  })
})