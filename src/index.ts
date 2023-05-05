import {Buffer} from "buffer";

export const ePrint = (e: any) => {
    console.log(e);
    throw e;
}

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

export function now(second: boolean = true): number {
    return Math.floor(new Date().getTime() / (second ? 1000 : 1))
}

export * from './account.js';
export * from './transaction.js';
export * from './local-db.js';