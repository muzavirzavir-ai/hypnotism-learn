import { Role } from "@/backend";
import { ClassCard } from "@/components/ClassCard";
import { CountdownTimer } from "@/components/CountdownTimer";
import { StudentDashboardPage } from "@/pages/StudentDashboardPage";
import {
  createMockBackend,
  mockActorState,
  renderWithProviders,
  setMockActor,
} from "@/test/test-utils";
import type { Class, StudentClassView, StudentDashboard } from "@/types";
import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => navigate,
    // The dashboard reads search params through a `select` callback; honour it.
    useRouterState: (opts?: { select?: (s: unknown) => unknown }) => {
      const state = { location: { search: {} } };
      return opts?.select ? opts.select(state) : state;
    },
    Link: ({
      children,
      to,
    }: {
      children: React.ReactNode;
      to?: string;
    }) => <a href={to ?? "#"}>{children}</a>,
  };
});

vi.mock("@caffeineai/core-infrastructure", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@caffeineai/core-infrastructure")>();
  return {
    ...actual,
    useActor: () => ({ actor: mockActorState.actor, isFetching: false }),
  };
});

function makeClass(id: bigint, order: bigint, title: string): Class {
  return {
    id,
    titleEn: title,
    titleMl: `${title} (ml)`,
    descriptionEn: `${title} description`,
    descriptionMl: `${title} description (ml)`,
    order,
    published: true,
    locked: false,
    createdAt: 1n,
    updatedAt: 1n,
  };
}

function makeView(
  classInfo: Class,
  overrides: Partial<StudentClassView> = {},
): StudentClassView {
  return {
    classInfo,
    locked: false,
    completed: false,
    remainingSeconds: 0n,
    ...overrides,
  };
}

function makeDashboard(
  classes: StudentClassView[],
  overrides: Partial<StudentDashboard> = {},
): StudentDashboard {
  const completedCount = BigInt(classes.filter((c) => c.completed).length);
  return {
    studentId: 1n,
    classes,
    totalCount: BigInt(classes.length),
    completedCount,
    remainingSeconds: 0n,
    ...overrides,
  };
}

/** Seed a restored student session so the dashboard resolves the student. */
function seedStudentSession(actor: ReturnType<typeof createMockBackend>) {
  window.sessionStorage.setItem("hypnotism.session", "tok-student");
  window.sessionStorage.setItem("hypnotism.identifier", "ada-01");
  actor.getSession = vi.fn().mockResolvedValue({
    role: Role.student,
    issuedAt: 1n,
  });
}

beforeEach(() => {
  navigate.mockReset();
  setMockActor(null);
  window.sessionStorage.clear();
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("student dashboard", () => {
  it("shows only assigned classes in sequence with locked ones marked", async () => {
    const first = makeClass(1n, 1n, "Foundations");
    const second = makeClass(2n, 2n, "Conversational");
    const actor = createMockBackend({
      resolveStudent: vi.fn().mockResolvedValue({
        id: 1n,
        name: "Ada",
        identifier: "ada-01",
        watermarkEnabled: false,
      }),
      getStudentDashboard: vi
        .fn()
        .mockResolvedValue(
          makeDashboard([
            makeView(first, { completed: true }),
            makeView(second, { locked: true, remainingSeconds: 3600n }),
          ]),
        ),
    });
    setMockActor(actor);
    seedStudentSession(actor);

    renderWithProviders(<StudentDashboardPage />);

    expect(await screen.findByText("Foundations")).toBeInTheDocument();
    expect(screen.getByText("Conversational")).toBeInTheDocument();
    // The locked class is clearly marked and its open action is disabled.
    expect(screen.getAllByText("Locked").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Locked/i })).toBeDisabled();
    // The completed class is marked and still offers an open action.
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /Open class/i }),
    ).toBeInTheDocument();
  });

  it("shows the empty state when no classes are assigned", async () => {
    const actor = createMockBackend({
      resolveStudent: vi.fn().mockResolvedValue({
        id: 1n,
        name: "Ada",
        identifier: "ada-01",
        watermarkEnabled: false,
      }),
      getStudentDashboard: vi.fn().mockResolvedValue(makeDashboard([])),
    });
    setMockActor(actor);
    seedStudentSession(actor);

    renderWithProviders(<StudentDashboardPage />);

    expect(
      await screen.findByText(/No classes have been assigned/i),
    ).toBeInTheDocument();
  });

  it("prompts sign-in when there is no session", async () => {
    setMockActor(createMockBackend());
    renderWithProviders(<StudentDashboardPage />);

    expect(
      await screen.findByText(/Sign in with your access key/i),
    ).toBeInTheDocument();
  });
});

describe("class card", () => {
  it("renders a locked class with a disabled action and a countdown", () => {
    const view = makeView(makeClass(2n, 2n, "Conversational"), {
      locked: true,
      remainingSeconds: 3600n,
      countdownEndsAt: BigInt(Date.now() + 3_600_000) * 1_000_000n,
    });
    renderWithProviders(<ClassCard view={view} index={2} studentId={1n} />);

    expect(screen.getAllByText("Locked").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Locked/i })).toBeDisabled();
    expect(screen.getByRole("timer")).toBeInTheDocument();
  });

  it("renders an unlocked class with an open link", () => {
    const view = makeView(makeClass(1n, 1n, "Foundations"));
    renderWithProviders(<ClassCard view={view} index={1} studentId={1n} />);

    expect(screen.getAllByText("Unlocked").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /Open class/i }),
    ).toBeInTheDocument();
  });
});

describe("countdown timer", () => {
  it("derives remaining time from the server timestamp, not the device clock", () => {
    // A server end time 90 minutes ahead of the real clock.
    const endsAt = BigInt(Date.now() + 90 * 60 * 1000) * 1_000_000n;
    renderWithProviders(<CountdownTimer endsAt={endsAt} />);

    // 01:29:xx or 01:30:00 depending on sub-second rounding; assert the hour.
    expect(screen.getByRole("timer")).toHaveTextContent(/^01:/);
  });

  it("clamps an already-elapsed server timestamp to zero", () => {
    const endsAt = BigInt(Date.now() - 60_000) * 1_000_000n;
    renderWithProviders(<CountdownTimer endsAt={endsAt} />);

    expect(screen.getByRole("timer")).toHaveTextContent("00:00:00");
  });
});
