import {env, mxKit, pNFT} from "../src";

describe("programmable nft test", () => {
  it('collection', async () => {
    await pNFT.createCollection()
  });

  it("createPNFT", async () => {
    await pNFT.createPNFT({
      name: "test",
      collection: "8fx33bT4ewHjTLFKTq16tHsdJKBZEA6YcL2WLNEUBNUH"
    });
  })
})