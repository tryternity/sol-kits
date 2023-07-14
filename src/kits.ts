// noinspection JSUnusedGlobalSymbols

import {Buffer} from "buffer";
import crypto from "crypto";
import {v4 as v4_uuid} from 'uuid';

export const ePrint = (e: any) => {
    console.log(e);
    throw e;
}

export module kits {
    export function json_replacer(key: any, value: any) {
        if (value instanceof Map) {
            let obj = {};
            // @ts-ignore
            Array.from(value.entries()).forEach(([k, v]) => obj[k] = v);
            return obj;
        } else if (value instanceof Buffer) {
            return 'Buffer' + value.toString("hex");
        } else if (value instanceof Array) {
            return value.map(item => item instanceof Buffer ? "Buffer:" + item.toString("hex") : item);
        } else if (typeof value === 'bigint') {
            return value.toString(10);
        } else {
            return value;
        }
    }

    export function toJson(obj: any): string {
        return JSON.stringify(obj, json_replacer);
    }

    export function uuid(underline: boolean = false): string {
        let uuid_str = v4_uuid();
        return underline ? uuid_str : uuid_str.replace(/-/g, "");
    }

    export function sha256(data: any): Buffer {
        return crypto.createHash('sha256').update(data).digest()
    }

    export function md5(str: string): Buffer {
        return crypto.createHash("md5").update(str).digest();
    }

    export function now(second: boolean = true): number {
        return Math.floor(new Date().getTime() / (second ? 1000 : 1))
    }

    export function userHome(): string {
        const os = require("os");
        return os.homedir();
    }

    export async function post(url: string, body: any): Promise<String> {
        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(body)
        }).catch(ePrint);
        return await text(response);
    }

    export async function text(response: Response): Promise<String> {
        if (response.body == null) {
            return "<null>";
        }
        const chunks: Array<any> = [];
        let reader = response.body.getReader();
        while (true) {
            let buff = await reader.read()
            if (!buff || !buff.value) {
                break
            }
            chunks.push(buff.value);
        }
        return Buffer.concat(chunks).toString("utf-8")
    }

    export function base64ToUint8Array(str: string): Uint8Array {
        return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
    }
}