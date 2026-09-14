import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { createVercelBlobProductStore } from "../../src/products/store.js";
import { createVercelBlobClaimsStore } from "../../src/claims/store.js";
import { createVercelBlobRefusalsStore } from "../../src/refusals/store.js";
import { generateProductionImage } from "../../src/production/service.js";
import { placeOnBackground } from "../../src/production/composite.js";
import { placeAssetOnRender } from "../../src/production/placement.js";
import { createVercelBlobIdentityAssetStore } from "../../src/identity-assets/store.js";
import { createVercelBlobProductionStore } from "../../src/production/store.js";
import { readJsonBody, requireBrandWorldAccess, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";

export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "This route only generates production images." });
    return;
  }
  try {
    const clientId = resolveClientId(request);
    const body = await readJsonBody(request);

    // Place on background, a side path. A request without this action never
    // reaches this branch and runs exactly as it did before, through the same
    // code below. Removing the branch and the import retires the whole
    // feature on this handler.
    if (body.action === "place-on-background") {
      const job = await placeOnBackground(body, {
        productionStore: createVercelBlobProductionStore({ clientId }),
        env: process.env,
      });
      sendJson(response, 200, { job });
      return;
    }

    // Deterministic placement, the Tier 1 path. The server composites the
    // stored pixels, optionally grounds them with the existing shadow pass,
    // composites again, and records the verification result. A request
    // without this action never reaches this branch.
    if (body.action === "place-asset") {
      const job = await placeAssetOnRender(body, {
        productionStore: createVercelBlobProductionStore({ clientId }),
        productStore: createVercelBlobProductStore({ clientId }),
        identityStore: createVercelBlobIdentityAssetStore({ clientId }),
        brainStore: createVercelBlobBrandBrainStore({ clientId }),
        env: process.env,
      });
      sendJson(response, 200, { job });
      return;
    }

    const job = await generateProductionImage(body, {
      brainStore: createVercelBlobBrandBrainStore({ clientId }),
      productionStore: createVercelBlobProductionStore({ clientId }),
      productStore: createVercelBlobProductStore({ clientId }),
      claimsStore: createVercelBlobClaimsStore({ clientId }),
      refusalsStore: createVercelBlobRefusalsStore({ clientId }),
      identityStore: createVercelBlobIdentityAssetStore({ clientId }),
      env: process.env,
    });
    sendJson(response, 200, { job });
  } catch (error) {
    sendPublicError(response, error);
  }
}

