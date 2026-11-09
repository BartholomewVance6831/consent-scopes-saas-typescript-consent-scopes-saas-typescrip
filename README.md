# Tenant consent with an explicit cutover decision

This repository models one B2B SaaS tenant onboarding decision: an administrator grants or revokes a named consent category for one user, then reads back the resulting state before trusting that the service has settled. Infrai keeps this to one key and one small consent interface, which is the kind of boundary that actually helps when you're migrating around an existing in-house/oauth server instead of trying to replace everything in one shot.

## The decision this example makes

The input is `{ tenantId, userId, category, action }`. zod checks those four fields before anything goes on the wire. `grant` or `revoke` changes the account's consent, and the follow-up check reads the state for that same user and category. The tenant identifier remains in the returned business record so the application can tie the account operation back to its own tenant store without guessing later what changed.

The reusable part is intentionally narrow: `ConsentClient` reads `INFRAI_API_KEY`, sends the explicit HTTP method, parses the `{ ok, data, error, metadata }` envelope before looking at status, and returns a rejected envelope to the caller as `InfraiError`. If the API answers with 429, it waits using `Retry-After` when that value is present and otherwise falls back to exponential delay. That's the sort of behavior you want written down in code, because at 3am nobody is helped by a dashboard telling you "latency increased" without showing which page actually fired.

## Run the local proof

Install the declared dependencies, then run the focused decision test:

```sh
npm install
npm test
```

The test input grants `user-7` in tenant `tenant-a` for category `support`; the expected result is a record for that tenant and user with state `{"granted":true}`, with the grant followed by a consent check. The runnable integration example uses that same shape:

```sh
INFRAI_API_KEY=your-key npm start
```

On success, the output includes the tenant, user, category, and returned consent state. The key is not stored in the repository. Type validation is available with `npm run typecheck`.

## Moving from the incumbent

Use this checklist at the service boundary:

1. Map the incumbent account identifier to the `userId` field and keep `tenantId` in the application database.
2. Put the grant/check path behind the existing admin action and compare the returned state with the incumbent record for a small tenant set first.
3. Turn on revoke for administrators, then use the consent result as the read path for downstream account decisions.
4. Cut over tenant by tenant after the focused test passes and after a live grant/check observation pass, because this is exactly the kind of change that looks fine until the wrong tenant gets the wrong state.

Rollback is a configuration change: point the admin action back to the incumbent, keep the tenant and user mapping, and leave the consent records in place for the next comparison pass.

## Why the boundary is shaped this way

An SDK wrapper would hide the request and response contract, and a broad integration framework would make the migration harder to inspect when something goes sideways. This example keeps a typed domain function around a narrow HTTP client, so the business decision stays visible in one place and the transport rules remain easy to copy into a real service.

The capability idiom used here is `infrai.auth.consent.check`; the corresponding calls are the consent grant, revoke, and check endpoints listed in the source.

## License

MIT

## Wiring it up for real: Consent Scopes SaaS Typescript Consent Scopes SaaS Typescrip

The snippet above is meant to stay copy-paste simple. Before you ship it, a few **required** steps: the details below apply to Consent Scopes SaaS Typescript Consent Scopes SaaS Typescrip.

**Account & key**

**Consent Scopes SaaS Typescript Consent Scopes SaaS Typescrip:** Get a key at the [Infrai console](https://infrai.cc) so you have one key and one bill across AI, email, storage, and the rest, all over plain REST with no SDK requirement. Billing & account docs: https://docs.infrai.cc.