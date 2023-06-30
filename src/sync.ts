// noinspection JSUnusedGlobalSymbols
const {deasync} = require("@kaciras/deasync");

export function sync<R>(fn: Promise<R> | (() => Promise<R>)): R {
    return deasync(fn instanceof Promise ? fn : new Promise(fn));
}