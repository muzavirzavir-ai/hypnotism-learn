// Registers the `@testing-library/jest-dom` matcher augmentation (e.g.
// `toBeInTheDocument`, `toHaveTextContent`) with Vitest's `Assertion`
// interface for the TypeScript program. The runtime setup lives in
// `vitest.setup.ts`, which sits outside the `src` include, so this
// declaration file is what makes the matchers visible to `tsc --noEmit`.
import "@testing-library/jest-dom/vitest";
