import { PocketIc } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

// The runner sets these before Vitest starts. `POCKET_IC_URL` is the platform
// sidecar's PocketIC server; `BACKEND_WASM` is the app's own compiled canister.
const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

// The keys the migration seeds into backend state. They are asserted here
// because the acceptance criteria name them explicitly.
const STUDENT_KEY = "96637";
const ADMIN_KEY = "88678";

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

// Deterministic callers. `createIdentity` is the only hand-free way to name a
// caller: the client re-exports no `Principal`, so `Principal.fromText` is not
// available from this directory.
const alice = createIdentity("hypnotism-alice");
const bob = createIdentity("hypnotism-bob");

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far; a failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error.
  await pic?.tearDown();
});

describe("empty-state reads", () => {
  it("answers the public class catalogue with an empty list", async () => {
    actor.setIdentity(alice);
    await expect(actor.listClasses()).resolves.toEqual([]);
  });
});

describe("access-key verification", () => {
  it("accepts the student key and returns a student session", async () => {
    actor.setIdentity(alice);
    const result = await actor.verifyAccessKey({ student: null }, STUDENT_KEY);
    expect(result).toHaveProperty("ok");
    if ("ok" in result) {
      expect(result.ok.role).toEqual({ student: null });
      expect(result.ok.token.length).toBeGreaterThan(0);
    }
  });

  it("accepts the admin key and returns an admin session", async () => {
    actor.setIdentity(alice);
    const result = await actor.verifyAccessKey({ admin: null }, ADMIN_KEY);
    expect(result).toHaveProperty("ok");
    if ("ok" in result) {
      expect(result.ok.role).toEqual({ admin: null });
    }
  });

  it("rejects an incorrect key without granting a role", async () => {
    actor.setIdentity(bob);
    const result = await actor.verifyAccessKey({ student: null }, "00000");
    expect(result).toEqual({ invalidKey: null });
  });

  it("round-trips a session through getSession and signOut", async () => {
    actor.setIdentity(alice);
    const verified = await actor.verifyAccessKey({ student: null }, STUDENT_KEY);
    if (!("ok" in verified)) {
      throw new Error("expected the student key to verify");
    }
    const token = verified.ok.token;

    const view = await actor.getSession(token);
    expect(view).toEqual([{ role: { student: null }, issuedAt: verified.ok.issuedAt }]);

    await actor.signOut(token);
    await expect(actor.getSession(token)).resolves.toEqual([]);
  });
});

describe("admin authorization", () => {
  it("lets an admin-key holder create a class and read it back", async () => {
    actor.setIdentity(alice);
    const verified = await actor.verifyAccessKey({ admin: null }, ADMIN_KEY);
    expect(verified).toHaveProperty("ok");

    const created = await actor.createClass({
      titleEn: "Foundations",
      titleMl: "അടിസ്ഥാനങ്ങൾ",
      descriptionEn: "Intro",
      descriptionMl: "ആമുഖം",
      published: true,
    });
    expect(created.titleEn).toBe("Foundations");

    const classes = await actor.listClasses();
    expect(classes.map((c) => c.id)).toContain(created.id);
  });

  it("rejects a non-admin caller from creating a class", async () => {
    actor.setIdentity(bob);
    await expect(
      actor.createClass({
        titleEn: "Sneaky",
        titleMl: "Sneaky",
        descriptionEn: "",
        descriptionMl: "",
        published: false,
      }),
    ).rejects.toThrow();
  });
});
