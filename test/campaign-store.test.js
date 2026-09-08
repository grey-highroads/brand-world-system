import assert from "node:assert/strict";
import test from "node:test";
import {
  createInMemoryCampaignBlobOperations,
  createVercelBlobCampaignStore,
  sanitizeCampaignId,
} from "../src/campaigns/store.js";

// Campaigns used to be a literal array in the browser's initial state, shared
// by every client and lost on reload. These tests hold the two properties that
// replaced it: a campaign belongs to one client, and it survives.

function twoClientStores() {
  const blob = createInMemoryCampaignBlobOperations();
  return {
    blob,
    clientA: createVercelBlobCampaignStore({ clientId: "client-a", blob }),
    clientB: createVercelBlobCampaignStore({ clientId: "client-b", blob }),
  };
}

test("a campaign saved for one client is listed for that client and not for another", async () => {
  const { clientA, clientB } = twoClientStores();

  await clientA.writeCampaign({
    id: "campaign-1",
    name: "Spring launch",
    objective: "Trial among existing buyers",
  });

  const listedForA = await clientA.listCampaigns();
  assert.equal(listedForA.length, 1);
  assert.equal(listedForA[0].name, "Spring launch");

  const listedForB = await clientB.listCampaigns();
  assert.deepEqual(listedForB, []);
  assert.equal(await clientB.readCampaign("campaign-1"), null);
});

test("two clients can hold campaigns under the same id without seeing each other's", async () => {
  const { clientA, clientB } = twoClientStores();

  await clientA.writeCampaign({ id: "campaign-1", name: "A campaign" });
  await clientB.writeCampaign({ id: "campaign-1", name: "B campaign" });

  assert.equal((await clientA.readCampaign("campaign-1")).name, "A campaign");
  assert.equal((await clientB.readCampaign("campaign-1")).name, "B campaign");
  assert.equal((await clientA.listCampaigns()).length, 1);
});

test("campaign records are written under the client's own namespace", async () => {
  const { blob, clientA } = twoClientStores();
  await clientA.writeCampaign({ id: "campaign-1", name: "Spring launch" });
  const paths = [...blob.store.keys()].sort();
  assert.deepEqual(paths, [
    "brand-world-system/clients/client-a/campaigns/campaign-1.json",
    "brand-world-system/clients/client-a/campaigns/index.json",
  ]);
});

test("saving again updates the record in place and keeps one index entry", async () => {
  const { clientA } = twoClientStores();
  const first = await clientA.writeCampaign({ id: "campaign-1", name: "Spring launch", objective: "Trial" });
  const second = await clientA.writeCampaign({ ...first, objective: "Repeat purchase" });

  assert.equal(second.objective, "Repeat purchase");
  assert.equal(second.createdAt, first.createdAt);
  assert.equal((await clientA.listCampaigns()).length, 1);
});

test("a partial update keeps the fields it did not send", async () => {
  const { clientA } = twoClientStores();
  await clientA.writeCampaign({
    id: "campaign-1",
    name: "Spring launch",
    objective: "Trial",
    channels: ["LinkedIn"],
  });
  const updated = await clientA.writeCampaign({ id: "campaign-1", objective: "Repeat purchase" });

  assert.equal(updated.name, "Spring launch");
  assert.deepEqual(updated.channels, ["LinkedIn"]);
});

test("deleting a campaign removes it from the record and from the index", async () => {
  const { clientA } = twoClientStores();
  await clientA.writeCampaign({ id: "campaign-1", name: "Spring launch" });
  await clientA.writeCampaign({ id: "campaign-2", name: "Autumn launch" });

  await clientA.deleteCampaign("campaign-1");

  const remaining = await clientA.listCampaigns();
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, "campaign-2");
  assert.equal(await clientA.readCampaign("campaign-1"), null);
});

test("a campaign needs an id and a name before it can be saved", async () => {
  const { clientA } = twoClientStores();
  await assert.rejects(() => clientA.writeCampaign({ name: "No id" }), /needs an id/);
  await assert.rejects(() => clientA.writeCampaign({ id: "campaign-1" }), /needs a name/);
});

test("a campaign id cannot escape the client namespace", () => {
  assert.equal(sanitizeCampaignId("../../other-client/brain"), "other-client-brain");
  assert.equal(sanitizeCampaignId("campaign-1"), "campaign-1");
  assert.equal(sanitizeCampaignId("///"), "");
});
