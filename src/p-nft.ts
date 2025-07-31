import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  CreateNftInput,
  NftWithToken,
  Sft, CreatorInput, Option,
} from '@metaplex-foundation/js';
import {
  TokenStandard,
  // createCreateMasterEditionV3Instruction,
  createMasterEditionV3,
  // createCreateMetadataAccountV3Instruction,
  createMetadataAccountV3,
  DataV2,
  Collection,
  Uses,
  Creator,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {env} from "./env";
import {mxKit} from "./metaplex";
import {Nft} from "@metaplex-foundation/js/src/plugins/nftModule/models/Nft";
import {kits} from "./kits";

// 可编程NFT数据接口
export interface ProgrammableNFTData {
  name?: string;
  symbol?: string;
  uri?: string;
  royalty?: number; // 版税基点 (例: 500 = 5%)
  creators?: CreatorInput[];
  collection?: PublicKey | string
  attributes?: {
    trait_type: string;
    value: string | number;
  }[];
  ruleSet?: PublicKey; // 可编程规则集
  uses?: Option<Uses>; // 使用限制
}

const meta_uri = "https://shdw-drive.genesysgo.net/4H5hPUt6ZD2ehs46ETy1x6wj5xK4SLEsUBhApRW8ZquX/4L8wcrVyc25KuZ8Rbg9yyzp1BZsEVgy929zDD9ZUEUfR.json"
// 可编程NFT类
export namespace pNFT {
// 创建可编程NFT集合
  export async function createCollection(
      name?: string,
      symbol?: string,
      uri?: string,
  ): Promise<Nft> {
    try {
      const metadata: CreateNftInput = {
        name: name ?? "TEST_CONNECTION",
        symbol: symbol ?? "TEST",
        uri: uri ?? meta_uri,
        sellerFeeBasisPoints: 500, // 5% 版税
        isCollection: true,
        creators: [
          {
            address: env.wallet.publicKey,
            share: 100,
          },
        ],
        tokenStandard: TokenStandard.ProgrammableNonFungible,
      };
      const {nft} = await mxKit.metaplex().nfts().create(metadata);
      kits.printExplorerUrl(nft.address.toString())
      return nft;
    } catch (error) {
      console.error('创建集合失败:', error);
      throw error;
    }
  }

  // 创建可编程NFT
  export async function createPNFT(
      data: ProgrammableNFTData
  ): Promise<Nft> {
    let collectionMint = typeof data.collection == 'string' ? new PublicKey(data.collection) : data.collection;
    try {
      const createInput: CreateNftInput = {
        name: data.name ?? 'TEST',
        symbol: data.symbol ?? "TEST",
        uri: data.uri ?? meta_uri,
        sellerFeeBasisPoints: data.royalty ?? 500,
        creators: data.creators ?? [
          {
            address: env.wallet.publicKey,
            share: 100,
          },
        ],
        tokenStandard: TokenStandard.ProgrammableNonFungible,
        ruleSet: data.ruleSet, // 可编程规则集
        collection: collectionMint,
      };

      const {nft} = await mxKit.metaplex().nfts().create(createInput);
      console.log('可编程NFT已创建:', nft.address.toString());
      kits.printExplorerUrl(nft.address.toString())
      // 如果指定了集合，验证NFT
      if (collectionMint) {
        await verifyCollection(nft.address, collectionMint);
      }
      return nft;
    } catch (error) {
      console.error('创建可编程NFT失败:', error);
      throw error;
    }
  }

  async function verifyCollection(
      nftMint: PublicKey,
      collectionMint: PublicKey
  ) {
    try {
      await mxKit.metaplex().nfts().verifyCollection({
        mintAddress: nftMint,
        collectionMintAddress: collectionMint,
        isSizedCollection: true,
      });
      console.log('NFT集合验证成功');
    } catch (error) {
      console.error('验证集合失败:', error);
      throw error;
    }
  }
}