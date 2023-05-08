import {keypairIdentity, Metaplex, mockStorage, NftWithToken,} from '@metaplex-foundation/js';
import {ePrint} from "./kits";
import {env} from "./env";

export module mx {
    export let metaplex = async (): Promise<Metaplex> => {
        return Metaplex.make(env.defaultConnection)
            .use(keypairIdentity(env.wallet))
            .use(mockStorage())
            .use(keypairIdentity(env.wallet));
    };

    export async function createNFT(options?: {
        uri?: string,
        name?: string,
        feePoints?: number,
    }): Promise<NftWithToken> {
        let mx: Metaplex = await metaplex();
        let out = await mx.nfts().create({
            uri: options?.uri ?? "https://collection.mooar.com/token/solana/ad7149197b1740c7a16cfd6e4a6caaee/81",
            name: options?.name ?? 'My NFT',
            sellerFeeBasisPoints: options?.feePoints ?? 200,
            ...{},
        }).catch(ePrint);
        let signature = out.response.signature;
        console.log("sig: " + signature, "nft: " + out.nft.address.toBase58(), "ata: " + out.tokenAddress.toBase58());
        await mx.connection.confirmTransaction(signature).catch(ePrint);
        return out.nft;
    }
}