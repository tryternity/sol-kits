// noinspection JSUnusedGlobalSymbols

import {
  BigNumber,
  CreateCompressedNftOutput,
  CreateNftInput,
  CreateSftInput,
  CreateSftOutput,
  keypairIdentity,
  Metaplex,
  mockStorage,
  Option
} from '@metaplex-foundation/js';
import {ePrint} from "./kits";
import {env} from "./env";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";
import {tx} from "./transaction";
import {account, Address} from "./account";
import BN from "bn.js";
import {TokenStandard} from "@metaplex-foundation/mpl-token-metadata";
import {createBurnCheckedInstruction} from "@solana/spl-token";

export module mxKit {

  import toPubicKey = account.toPubicKey;
  export let metaplex = (programId?: string | PublicKey): Metaplex => {
    let mx = Metaplex.make(env.defaultConnection)
    .use(keypairIdentity(env.wallet))
    .use(mockStorage());
    if (programId) {
      mx.use({
        install(metaplex: Metaplex): void {
          metaplex.programs().getAuctionHouse = () => {
            return {
              name: "AuctionHouseProgram",
              address: programId instanceof PublicKey ? programId : new PublicKey(programId),
            };
          }
        }
      })
    }
    return mx;
  };
  export type DefaultCreate = {
    maxSupply?: Option<BigNumber>;
    name?: string;
    sellerFeeBasisPoints?: number;
    uri?: string
  }

  export async function createNft(tokenOwner: Address, options?: CreateNftInput | DefaultCreate): Promise<CreateCompressedNftOutput> {
    let mx: Metaplex = metaplex();
    const input = {
      tokenOwner: account.toPubicKey(tokenOwner),
      maxSupply: options?.maxSupply ?? new BN(0) as BigNumber,
      name: options?.name ?? "TEST",
      sellerFeeBasisPoints: options?.sellerFeeBasisPoints ?? 500,
      uri: options?.uri ?? "https://shdw-drive.genesysgo.net/4H5hPUt6ZD2ehs46ETy1x6wj5xK4SLEsUBhApRW8ZquX/4L8wcrVyc25KuZ8Rbg9yyzp1BZsEVgy929zDD9ZUEUfR.json",
      ...options,
    };
    let out = await mx.nfts().create(input).catch(ePrint);
    let signature = out.response.signature;
    console.log("sig: " + signature, "nft: " + out.nft.address.toBase58(), "ata: " + out.tokenAddress.toBase58());
    await confirmTransaction(mx.connection, signature);
    return out;
  }

  export async function createSft(options?: CreateSftInput | DefaultCreate): Promise<CreateSftOutput> {
    let mx: Metaplex = metaplex();
    const input = {
      maxSupply: options?.maxSupply ?? new BN(0) as BigNumber,
      name: options?.name ?? "TEST",
      sellerFeeBasisPoints: options?.sellerFeeBasisPoints ?? 500,
      uri: options?.uri ?? "https://shdw-drive.genesysgo.net/4H5hPUt6ZD2ehs46ETy1x6wj5xK4SLEsUBhApRW8ZquX/4L8wcrVyc25KuZ8Rbg9yyzp1BZsEVgy929zDD9ZUEUfR.json",
      ...options,
    } as CreateSftInput;
    let out = await mx.nfts().createSft(input).catch(ePrint);
    let signature = out.response.signature;
    console.log("sig: " + signature, "nft: " + out.mintAddress.toBase58(), "ata: " + out.tokenAddress?.toBase58());
    await confirmTransaction(mx.connection, signature);
    return out;
  }

  export async function mintSft(mint: Address, tokenOwner: Address, options?: {
    amount?: number,
    authority?: Keypair,
  }) {
    let mx: Metaplex = metaplex();
    let output = await mx.nfts().mint({
      amount: {
        basisPoints: new BN(options?.amount ?? 1) as BigNumber,
        currency: {
          symbol: '',
          decimals: 0,
          namespace: 'spl-token'
        }
      },
      authority: options?.authority ?? env.wallet,
      nftOrSft: {
        address: toPubicKey(mint),
        tokenStandard: TokenStandard.NonFungible
      },
      toOwner: toPubicKey(tokenOwner)
    })
    return output.response.signature
  }

  export async function burnSft(mint: Address, ata: PublicKey | string, options?: {
    amount?: number,
    authority?: Keypair,
  }) {
    const burnIx = createBurnCheckedInstruction(
        toPubicKey(ata), // PublicKey of Owner's Associated Token Account
        toPubicKey(mint), // Public Key of the Token Mint Address
        toPubicKey(options?.authority ?? env.wallet), // Public Key of Owner's Wallet
        options?.amount ?? 1, // Number of tokens to burn
        0 // Number of Decimals of the Token Mint
    );
    let latestBlockhash = await env.defaultConnection.getLatestBlockhash('finalized');
    const messageV0 = new TransactionMessage({
      payerKey: toPubicKey(options?.authority ?? env.wallet),
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [burnIx]
    }).compileToV0Message();
    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([options?.authority ?? env.wallet])
    const signature = await env.defaultConnection.sendTransaction(transaction).catch(ePrint);
    await confirmTransaction(env.defaultConnection, signature);
    return signature;
  }

  /**
   * 创建一个普通的mint token当作nft进行测试
   *
   * @param tokenOwner
   * @return [mint, ata]
   */
  export async function simulateCreateNft(tokenOwner: Address): Promise<[PublicKey, PublicKey]> {
    let mint = await tx.createMint();
    await tx.airDrop(tokenOwner, {amount: 1, mint});
    return [mint, await account.ata(tokenOwner, mint)];
  }

  /**
   * 判断一个collection mint是否有效(是否有metadata)
   * @param collectionMint
   * @param conn
   */
  export async function validateCollectionMint(collectionMint: PublicKey | string, conn: Connection): Promise<boolean> {
    let connection = conn ? conn : env.defaultConnection;
    let mintKey = collectionMint instanceof PublicKey ? collectionMint : new PublicKey(collectionMint);
    let mintInfo = await connection.getAccountInfo(mintKey);
    if (mintInfo == undefined || mintInfo.lamports == 0) {
      return false;
    }
    let TOKEN_METADATA_PID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    let [metaKey] = PublicKey.findProgramAddressSync([
          Buffer.from("metadata"),
          TOKEN_METADATA_PID.toBuffer(),
          mintKey.toBuffer()
        ],
        TOKEN_METADATA_PID
    );
    let metaInfo = await connection.getAccountInfo(metaKey);
    return metaInfo != undefined && metaInfo.lamports > 0 && metaInfo.data.length > 0;
  }
}

async function confirmTransaction(connection: Connection, signature: string) {
  let latestBlockhash = await connection.getLatestBlockhash('finalized');
  await connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
  }).catch(ePrint);
}