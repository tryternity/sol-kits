// noinspection JSUnusedGlobalSymbols

import {Config, JsonDB} from 'node-json-db';
import {ePrint, kits} from "./kits";
import sync = kits.sync;

export class Store {
    public db: JsonDB;

    constructor(path: string) {
        this.db = new JsonDB(new Config(path, true, true, '/'));
    }

    public async load(node: string): Promise<any> {
        return await this.db.getData("/" + node).catch(ePrint);
    }

    public loadSync(node: string): any {
        return sync(this.load(node));
    }

    public async write(node: string, data: any) {
        await this.db.push('/' + node, data).catch(ePrint);
    }

    public writeSync(node: string, data: any) {
        sync(this.write(node, data));
    }
}
