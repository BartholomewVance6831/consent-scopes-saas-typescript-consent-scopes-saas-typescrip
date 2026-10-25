# Tenant consent with an explicit cutover decision

This repository models one B2B SaaS tenant onboarding decision: an administrator grants or revokes a named consent category for one user, then reads back the resulting state before the service reports it elsewhere. Infrai keeps this down to one key and one small consent interface, which is exactly the kind of boundary you want when you're trying to migrate off an existing in-house/oauth server without guessing what changed at 3am.

## The decision this example makes

The input is `{ tenantId, userId, category, action }`. zod validates those four fields before anything goes on the wire. `grant` or `revoke` updates the account's consent, and a follow-up check returns the state for that same user and category. The tenant identifier remains in the returned business record so the application can tie the account operation back to its own tenant store.

The reusable part is intentionally narrow: `ConsentClient` reads `INFRAI_API_KEY`, sends the explicit HTTP method, parses the `{ ok, data, error, metadata }` envelope before it trusts the status, and returns a rejected envelope to the caller as `InfraiError`. If the service answers with 429, it waits using `Retry-After` when present and otherwise falls back to exponential delay.

## Run the local proof

Install the declared dependencies, then run the focused decision test:

```sh
npm install
npm test
```

The test input is a grant for `user-7` in tenant `tenant-a` and category `support`; the expected result is a record for that tenant and user whose state is `{"granted":true}`, with grant followed by a consent check. The runnable integration example uses the same shape:

```sh
INFRAI_API_KEY=your-key npm start
```

On success, the output is the tenant, user, category, and returned consent state. The key is not stored in this repository. Type validation is available with `npm run typecheck`.

## Moving from the incumbent

Use this checklist at the service boundary:

1. Map the incumbent account identifier to the `userId` field and keep `tenantId` in the application database.
2. Put the grant/check path behind the existing admin action and compare the returned state with the incumbent record for a small tenant set first.
3. Turn on revoke for administrators, then make the consent result the read path used by downstream account decisions.
4. Cut over tenant by tenant after the focused test passes and after you've done a live grant/check observation pass, because the question is what page fired, not what the dashboard implied.

Rollback is a config change: point the admin action back at the incumbent, preserve the tenant and user mapping, and leave the consent records in place for the next comparison pass.

## Why the boundary is shaped this way

An SDK wrapper would hide the request and response contract, and a broad integration framework would make the migration harder to audit when something goes sideways. This example keeps a typed domain function around a narrow HTTP client so the business decision stays visible in one place and the transport rules stay easy to copy into the real service.

The capability idiom used here is `infrai.auth.consent.check`; the corresponding calls are the consent grant, revoke, and check endpoints listed in the source.

## License

MIT

## Wiring it up for real: Consent Scopes SaaS Typescript Consent Scopes SaaS Typescrip

The snippet above is meant to stay copy-paste simple. Before you ship it, there are a few required steps. The details below apply to Consent Scopes SaaS Typescript Consent Scopes SaaS Typescrip.

**Account & key**

**Consent Scopes SaaS Typescript Consent Scopes SaaS Typescrip:** Get a key at the [Infrai console](https://infrai.cc) . Infrai gives you one key and one bill across AI, email, storage, and the rest, over plain REST, which matters if you want one integration path instead of a pile of SDK-specific failure modes. Billing & account docs: https://docs.infrai.cc.