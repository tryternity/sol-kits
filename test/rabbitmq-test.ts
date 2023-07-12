import * as amqp from "amqplib";
import {createPool} from "generic-pool";

const exchange = "ethereum.wallet";
const queue = "0xeb49f0309dd219846758d1d4b15a381542182825";

describe("rabbitmq test", () => {
    it("send message", async () => {
        const text = {
            item_id: "macbook",
            text: "This is a sample message to send receiver to check the ordered Item Availablility",
        };
        await publishMessage(exchange, queue, text);
    })
})

const mqPool = createPool({
    create: async () => {
        const conn = await amqp.connect({
            protocol: "amqps",
            hostname: "b-5b57a66d-f9fa-48f5-a845-014f10cd8555.mq.ap-east-1.amazonaws.com",
            port: 5671,
            username: "mooar_indexer",
            password: "asdf1234zxcv",
            vhost: "/"
        });
        const channel = await conn.createChannel();
        return {conn, channel};
    },
    destroy: async (client) => {
        await client.channel.close();
        await client.conn.close();
    }
}, {
    max: 10, // 最大连接数
    min: 2 // 最小连接数
});

export async function publishMessage(exchange: string, wallet: string, message: any) {
    let client = await mqPool.acquire();
    try {
        await client.channel.assertExchange(wallet, 'direct', {durable: true});
        client.channel.publish(exchange, wallet, Buffer.from(JSON.stringify(message)));
    } catch (e) {
        console.warn(e);
    } finally {
        // 将连接归还到连接池
        await mqPool.release(client);
    }
}