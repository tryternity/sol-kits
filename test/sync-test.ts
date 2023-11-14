import {sync} from "../dist/sync";
import {env, mxKit} from "../dist";

let ak = sync(async () => {
  let exist1 = await mxKit.validateCollectionMint("9toSehzuBh5poQa5MdTvkhU9jrAczDpnQ3fMxsUXWf29", env.defaultConnection);
  console.log("===", exist1)
  return "xxxx"
});
describe("sync test", () => {
  it("sync test", () => {
    console.log(ak)
  })
})