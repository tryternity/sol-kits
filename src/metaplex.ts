// noinspection JSUnusedGlobalSymbols

import {
    CreateCompressedNftOutput,
    CreateNftInput,
    keypairIdentity,
    Metaplex,
    mockStorage
} from '@metaplex-foundation/js';
import {ePrint, kits} from "./kits";
import {env} from "./env";
import {PublicKey} from "@solana/web3.js";
import {tx} from "./transaction";
import {account, Address} from "./account";

export module mxKit {
    import sync = kits.sync;
    export let metaplex = (programId?: string | PublicKey): Metaplex => {
        let mx = Metaplex.make(env.defaultConnection)
            .use(keypairIdentity(env.wallet))
            .use(mockStorage())
            .use(keypairIdentity(env.wallet));
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

    export async function createNFT(tokenOwner: Address, options?: {
        uri?: string,
        name?: string,
        sellerFeeBasisPoints?: number,
    } & CreateNftInput): Promise<CreateCompressedNftOutput> {
        let mx: Metaplex = metaplex();
        let out = await mx.nfts().create({
            uri: options?.uri ?? "https://collection.mooar.com/token/solana/ad7149197b1740c7a16cfd6e4a6caaee/81",
            name: options?.name ?? 'My NFT',
            sellerFeeBasisPoints: options?.sellerFeeBasisPoints ?? 200,
            tokenOwner: account.toPubicKey(tokenOwner),
            ...options,
        }).catch(ePrint);
        let signature = out.response.signature;
        console.log("sig: " + signature, "nft: " + out.nft.address.toBase58(), "ata: " + out.tokenAddress.toBase58());
        await mx.connection.confirmTransaction(signature).catch(ePrint);
        return out;
    }

    export function createNFTSync(tokenOwner: Address, options?: {
        uri?: string,
        name?: string,
        sellerFeeBasisPoints?: number,
    } & CreateNftInput): CreateCompressedNftOutput {
        return sync(createNFT(tokenOwner, options));
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

    export function simulateCreateNftSync(tokenOwner: Address): [PublicKey, PublicKey] {
        return sync(simulateCreateNft(tokenOwner));
    }
}