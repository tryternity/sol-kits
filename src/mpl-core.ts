import {Keypair, PublicKey} from "@solana/web3.js";
import {
  fetchAsset,
  transferV1,
  createV1,
  mplCore,
  createCollectionV1
} from '@metaplex-foundation/mpl-core'
import {env} from "./env";
import bs58 from "bs58";
import {generateSigner} from "@metaplex-foundation/umi";
import base58 from "bs58";
import {kits} from "./kits";

export module mpl_core {
  export async function transfer(asset: PublicKey | string, newOwner: PublicKey | string, signer?: Keypair, collection?: PublicKey | string) {
    const umi = env.umi()
    umi.use(mplCore())

    let ret = await transferV1(umi, {
      asset: env.toUmiPublicKey(asset),
      newOwner: env.toUmiPublicKey(newOwner),
      collection: collection ? env.toUmiPublicKey(collection) : undefined,
      authority: signer ? env.toUmiSigner(signer, umi) : undefined
    }).sendAndConfirm(umi)
    return bs58.encode(ret.signature);
  }

  const uri = "https://arweave.net/-UUOtLiB4db50w5QWxhHVNUKbAAEfzGXtIbcY2VRJ5A";

  export async function createCollection(arg?: {
    name?: string,
    uri?: string,
  }): Promise<PublicKey> {
    const umi = env.umi().use(mplCore())
    const collection = generateSigner(umi)
    let ret = await createCollectionV1(umi, {
      name: arg?.name ?? "CoreCollection",
      uri: arg?.uri ?? uri,
      collection: collection,
      updateAuthority: env.toUmiPublicKey(env.wallet.publicKey)
    }).sendAndConfirm(umi);
    kits.printExplorerUrl(collection.publicKey)
    kits.printExplorerUrl(base58.encode(ret.signature))
    return new PublicKey(collection.publicKey)
  }

  export async function createCore(collection?: PublicKey | string, arg?: {
    name?: string,
    uri?: string,
  }): Promise<PublicKey> {
    const umi = env.umi().use(mplCore())
    const asset = generateSigner(umi)
    const result = await createV1(umi, {
      name: arg?.name ?? "CoreNFT",
      uri: arg?.uri ?? uri,
      asset: asset,
      collection: collection ? env.toUmiPublicKey(collection) : undefined,
      updateAuthority: !!collection ? undefined : env.toUmiPublicKey(env.wallet.publicKey),
      plugins: []
    }).sendAndConfirm(umi)
    kits.printExplorerUrl(asset.publicKey)
    kits.printExplorerUrl(base58.encode(result.signature))
    return new PublicKey(asset.publicKey)
  }

  export async function data(asset: PublicKey | string) {
    const umi = env.umi().use(mplCore())
    return await fetchAsset(umi, typeof asset == 'string' ? asset : asset.toBase58())
  }
}