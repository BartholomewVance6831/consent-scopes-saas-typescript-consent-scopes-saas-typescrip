import assert from "node:assert/strict";
import { decideConsent } from "./consent_scopes.ts";

const calls: string[] = [];
const client = {
  grant: async (userId: string) => { calls.push(`grant:${userId}`); },
  revoke: async (userId: string) => { calls.push(`revoke:${userId}`); },
  check: async (userId: string, category: string) => { calls.push(`check:${userId}:${category}`); return { granted: true }; }
};

const result = await decideConsent({ tenantId: "tenant-a", userId: "user-7", category: "support", action: "grant" }, client);
assert.deepEqual(result, { tenantId: "tenant-a", userId: "user-7", category: "support", state: '{"granted":true}' });
assert.deepEqual(calls, ["grant:user-7", "check:user-7:support"]);
console.log("consent decision test passed");
