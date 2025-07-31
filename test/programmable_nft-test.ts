import {pNFT} from "../src";

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

  it("transfer", async () => {
    await pNFT.transfer("FoLSCrZ8Vmu3AgnvgG1C2JJns896W1UWCVEUstqz6Maz", "")
  })
})