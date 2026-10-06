import { KeyKind, Role } from "@/backend";
import { AccessKeyForm } from "@/components/AccessKeyForm";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { AdminAccessPage } from "@/pages/AdminAccessPage";
import { LandingPage } from "@/pages/LandingPage";
import {
  createMockBackend,
  mockActorState,
  renderWithProviders,
  setMockActor,
} from "@/test/test-utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The router hooks used by the hero/admin pages are not under test here; stub
// navigation so the components render without a RouterProvider.
const navigate = vi.fn();
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => navigate,
    Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Replace the actor hook with a local typed mock. Declared at module top level
// so Vitest hoists it above the imports that consume it.
vi.mock("@caffeineai/core-infrastructure", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@caffeineai/core-infrastructure")>();
  return {
    ...actual,
    useActor: () => ({ actor: mockActorState.actor, isFetching: false }),
  };
});

beforeEach(() => {
  navigate.mockReset();
  setMockActor(null);
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe("landing page", () => {
  it("renders the HYPNOTISM brand, intro, and student access form", () => {
    setMockActor(createMockBackend());
    renderWithProviders(<LandingPage />);

    expect(screen.getByText("HYPNOTISM")).toBeInTheDocument();
    expect(
      screen.getByText(/Explore expert-led, ethical courses/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Student Access")).toBeInTheDocument();
    expect(screen.getByLabelText("Access key")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Unlock Classes/i }),
    ).toBeInTheDocument();
  });

  it("shows the educational/ethical disclaimer in the footer", () => {
    setMockActor(createMockBackend());
    renderWithProviders(<Footer />);

    expect(screen.getByText("Educational & Ethical Use")).toBeInTheDocument();
    expect(
      screen.getByText(/not a substitute for qualified medical/i),
    ).toBeInTheDocument();
  });
});

describe("student access key form", () => {
  it("verifies the student key and reports success", async () => {
    const user = userEvent.setup();
    const actor = createMockBackend({
      verifyAccessKey: vi.fn().mockResolvedValue({
        __kind__: "ok",
        ok: { token: "tok-1", role: Role.student, issuedAt: 1n },
      }),
    });
    setMockActor(actor);
    const onSuccess = vi.fn();
    renderWithProviders(
      <AccessKeyForm
        kind="student"
        labelKey="access.keyLabel"
        placeholderKey="access.keyPlaceholder"
        submitKey="access.submit"
        collectIdentifier
        onSuccess={onSuccess}
      />,
    );

    await user.type(screen.getByLabelText("Access key"), "96637");
    await user.click(screen.getByRole("button", { name: /Unlock Classes/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(actor.verifyAccessKey).toHaveBeenCalledWith(
      KeyKind.student,
      "96637",
    );
  });

  it("rejects an incorrect key with a visible error and grants no role", async () => {
    const user = userEvent.setup();
    const actor = createMockBackend({
      verifyAccessKey: vi
        .fn()
        .mockResolvedValue({ __kind__: "invalidKey", invalidKey: null }),
    });
    setMockActor(actor);
    const onSuccess = vi.fn();
    renderWithProviders(
      <AccessKeyForm
        kind="student"
        labelKey="access.keyLabel"
        placeholderKey="access.keyPlaceholder"
        submitKey="access.submit"
        onSuccess={onSuccess}
      />,
    );

    await user.type(screen.getByLabelText("Access key"), "00000");
    await user.click(screen.getByRole("button", { name: /Unlock Classes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /access key is not valid/i,
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("surfaces a rate-limit error after repeated failures", async () => {
    const user = userEvent.setup();
    const actor = createMockBackend({
      verifyAccessKey: vi.fn().mockResolvedValue({
        __kind__: "rateLimited",
        rateLimited: { retryAfterSeconds: 42n },
      }),
    });
    setMockActor(actor);
    renderWithProviders(
      <AccessKeyForm
        kind="student"
        labelKey="access.keyLabel"
        placeholderKey="access.keyPlaceholder"
        submitKey="access.submit"
        onSuccess={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Access key"), "00000");
    await user.click(screen.getByRole("button", { name: /Unlock Classes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Too many attempts.*42 seconds/i,
    );
  });
});

describe("admin access page", () => {
  it("verifies the admin key and navigates to the admin console", async () => {
    const user = userEvent.setup();
    const actor = createMockBackend({
      verifyAccessKey: vi.fn().mockResolvedValue({
        __kind__: "ok",
        ok: { token: "admin-tok", role: Role.admin, issuedAt: 1n },
      }),
    });
    setMockActor(actor);
    renderWithProviders(<AdminAccessPage />);

    expect(screen.getByText("Admin Access")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Admin access key"), "88678");
    await user.click(
      screen.getByRole("button", { name: /Enter Admin Console/i }),
    );

    await waitFor(() =>
      expect(actor.verifyAccessKey).toHaveBeenCalledWith(
        KeyKind.admin,
        "88678",
      ),
    );
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/admin" }),
    );
  });
});

describe("session persistence", () => {
  it("restores a persisted session from storage on refresh", async () => {
    const actor = createMockBackend({
      getSession: vi.fn().mockResolvedValue({
        role: Role.student,
        issuedAt: 1n,
      }),
    });
    setMockActor(actor);
    window.sessionStorage.setItem("hypnotism.session", "tok-restored");
    window.sessionStorage.setItem("hypnotism.identifier", "ada-01");

    renderWithProviders(<Header />);

    // The restored session is reflected in the header once the token verifies.
    expect(
      await screen.findByText(/Signed in as Student/i),
    ).toBeInTheDocument();
    expect(actor.getSession).toHaveBeenCalledWith("tok-restored");
  });

  it("signs out explicitly and clears the stored session", async () => {
    const user = userEvent.setup();
    const actor = createMockBackend({
      getSession: vi.fn().mockResolvedValue({
        role: Role.student,
        issuedAt: 1n,
      }),
      signOut: vi.fn().mockResolvedValue(undefined),
    });
    setMockActor(actor);
    window.sessionStorage.setItem("hypnotism.session", "tok-restored");
    window.sessionStorage.setItem("hypnotism.identifier", "ada-01");

    renderWithProviders(<Header />);

    await user.click(await screen.findByRole("button", { name: /Sign Out/i }));

    await waitFor(() =>
      expect(actor.signOut).toHaveBeenCalledWith("tok-restored"),
    );
    expect(window.sessionStorage.getItem("hypnotism.session")).toBeNull();
    expect(window.sessionStorage.getItem("hypnotism.identifier")).toBeNull();
  });
});
