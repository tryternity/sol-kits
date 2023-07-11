import {env, mxKit} from "../dist";

describe("nft collection burn test", () => {
    it("check collection burn", async () => {
        let conn = env.defaultConnection;
        let exist1 = await mxKit.validateCollectionMint("9toSehzuBh5poQa5MdTvkhU9jrAczDpnQ3fMxsUXWf29", conn);
        console.log(exist1)

        let exist2 = await mxKit.validateCollectionMint("9jLk5Xzn9Dqwzi988ZWybz7ib9hxqq22r7WypiiSnuN6", conn);
        console.log(exist2)
    })
})