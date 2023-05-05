import {Config, JsonDB} from 'node-json-db';
import {ePrint} from "./kits";

export class Store {
    public db: JsonDB;

    constructor(path: string) {
        this.db = new JsonDB(new Config(path, true, true, '/'));
    }

    public async load(node: string): Promise<any> {
        return await this.db.getData("/" + node).catch(ePrint);
    }

    public async write(node: string, data: any) {
        await this.db.push('/' + node, data).catch(ePrint);
    }
}
