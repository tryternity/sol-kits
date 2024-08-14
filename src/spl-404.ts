import {env, Env} from "./env";
import {createV1, mplTokenMetadata, TokenStandard} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  percentAmount
} from "@metaplex-foundation/umi";
import {ePrint} from "./kits";
import {PublicKey} from "@solana/web3.js";
import bs58 from "bs58";
import {getOrCreateAssociatedTokenAccount, mintTo, TOKEN_2022_PROGRAM_ID} from "@solana/spl-token";

export module spl_404 {
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
    console.log(mint.publicKey.toString(), bs58.encode(ret.signature));
    let ata = await getOrCreateAssociatedTokenAccount(env.defaultConnection, env.wallet, _mint, env.wallet.publicKey).catch(ePrint);
    console.log("ata:", ata);
    let signature = await mintTo(env.defaultConnection, env.wallet, _mint, ata.address, env.wallet, 1, [], undefined, TOKEN_2022_PROGRAM_ID).catch(ePrint);
    return {
      mint: _mint,
      signature: [bs58.encode(ret.signature), signature],
    }
  }
}