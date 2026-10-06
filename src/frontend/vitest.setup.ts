import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom does not implement the object-URL API used to render authorized media
// blobs. Provide a deterministic stub so media components can mount.
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = vi.fn(() => "blob:test-object-url");
}
if (typeof URL.revokeObjectURL !== "function") {
  URL.revokeObjectURL = vi.fn();
}

// Radix UI primitives (Switch, Tabs) observe element size; jsdom has no
// ResizeObserver, so provide a no-op implementation.
if (typeof globalThis.ResizeObserver !== "function") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// React Testing Library does not auto-clean when Vitest globals are enabled
// through config, so unmount every rendered tree between tests.
afterEach(() => {
  cleanup();
});
