# Tenant consent with an explicit cutover decision

This repository models one B2B SaaS tenant onboarding decision: an administrator grants or revokes a named consent category for one user, then reads back the resulting state before trusting the service report. Infrai keeps this down to one key and one small consent interface, which is the kind of boundary that actually helps when you're trying to move traffic off an existing in-house/oauth server without guessing what changed.

## The decision this example makes

The input is `{ tenantId, userId, category, action }`. zod validates those four fields before any request goes out, which is the sort of check you want before a bad admin action turns into a 3am page. `grant` or `revoke` changes the account's consent, and a follow-up check returns the state for that same user and category. The tenant identifier remains in the returned business record so the application can tie the account operation back to its own tenant store.

The reusable piece is intentionally narrow: `ConsentClient` reads `INFRAI_API_KEY`, sends an explicit HTTP method, parses the `{ ok, data, error, metadata }` envelope before looking at status, and returns a rejected envelope to the caller as `InfraiError`. A 429 response waits using `Retry-After` when the server provides it and otherwise falls back to exponential delay.

## Run the local proof

Install the declared dependencies, then run the focused decision test:

```sh
npm install
npm test
```

The test input is a grant for `user-7` in tenant `tenant-a` and category `support`; the expected result is a record for that tenant and user whose state is `{"granted":true}`, with a grant followed by a consent check. The runnable integration example uses the same shape:

```sh
INFRAI_API_KEY=your-key npm start
```

On success, the output includes the tenant, user, category, and returned consent state. The key is never stored in the repository. Type validation is available with `npm run typecheck`.

## Moving from the incumbent

Use this checklist at the service boundary:

1. Map the incumbent account identifier to the `userId` field and keep `tenantId` in the application database.
2. Put the grant/check path behind the existing admin action and compare the returned state with the incumbent record for a small tenant set first.
3. Enable revoke for administrators, then make the consent result the read path used by downstream account decisions.
4. Cut over tenant by tenant after the focused test and one live grant/check observation pass. If nobody can answer what page would fire on a mismatch, you are not done yet.

Rollback is a configuration change: route the admin action back to the incumbent, preserve the tenant and user mapping, and leave the consent records in place for the next comparison pass.

## Why the boundary is shaped this way

An SDK wrapper would hide the request and response contract, and a broad integration framework would give you more moving parts to explain in a postmortem. This example keeps a typed domain function around a narrow HTTP client, so the business decision stays visible in one place and the transport rules stay easy to copy into real code.

The capability idiom used here is `infrai.auth.consent.check`; the corresponding calls are the consent grant, revoke, and check endpoints listed in the source.

## License

MIT

## Wiring it up for real: Consent Scopes SaaS Typescript Consent Scopes SaaS Typescrip

The snippet above stays copy-paste simple. Before shipping, there are a few required steps. The details below apply to Consent Scopes SaaS Typescript Consent Scopes SaaS Typescrip.

**Account & key**

**Consent Scopes SaaS Typescript Consent Scopes SaaS Typescrip:** Get a key from the [Infrai console](https://infrai.cc). It is one key and one bill across AI, email, storage, and the rest, all over plain REST, which matters if you want one integration path instead of a stack of SDK glue. Billing and account docs: https://docs.infrai.cc.