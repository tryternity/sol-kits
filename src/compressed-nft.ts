import axios from "axios";
import {PublicKey} from "@solana/web3.js";

export const HELIUS_RPC = "https://rpc-devnet.helius.xyz/?api-key=d4654c49-78d9-49cf-9a9f-4d5b0c9074d9";


export module cNFT {
    export async function getAsset(assetId: string | PublicKey, rpcUrl = HELIUS_RPC): Promise<any> {
        return await post(rpcUrl, "getAsset", {
            id: assetId instanceof PublicKey ? assetId : new PublicKey(assetId)
        });
    }


    export async function getAssetProof(assetId: PublicKey | string, rpcUrl = HELIUS_RPC): Promise<any> {
        return await post(rpcUrl, "getAssetProof", {
            id: assetId instanceof PublicKey ? assetId : new PublicKey(assetId)
        });
    }

    export async function getAssetsByOwner(
        wallet: PublicKey | string,
        page?: number,
        limit?: number,
        rpcUrl = HELIUS_RPC
    ): Promise<any> {
        return await post(rpcUrl, "getAssetsByOwner", {
            ownerAddress: wallet instanceof PublicKey ? wallet : new PublicKey(wallet),
            page: page ?? 1,
            limit: limit ?? 10
        });
    }

    export async function getAssetsByGroup(collection: PublicKey | string,
                                           page?: number,
                                           limit?: number,
                                           rpcUrl = HELIUS_RPC) {
        return await post(rpcUrl, "getAssetsByGroup", {
            groupKey: "collection",
            groupValue: collection instanceof PublicKey ? collection : new PublicKey(collection),
            page: page ?? 1,
            limit: limit ?? 10
        });
    }
}

async function post(url: string, method: string, params: any) {
    try {
        const axiosInstance = axios.create({
            baseURL: url,
        });
        const response = await axiosInstance.post(url, {
            jsonrpc: "2.0",
            id: "rpd-op-123",
            method,
            params: params,
        });
        return response.data.result;
    } catch (error) {
        console.error(error);
        throw error;
    }
}