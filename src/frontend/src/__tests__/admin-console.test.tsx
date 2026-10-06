import { Role } from "@/backend";
import { ClassManager } from "@/components/admin/ClassManager";
import { StudentManager } from "@/components/admin/StudentManager";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import {
  createMockBackend,
  mockActorState,
  renderWithProviders,
  setMockActor,
} from "@/test/test-utils";
import type { Class, StudentView } from "@/types";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => navigate,
    useRouterState: (opts?: { select?: (s: unknown) => unknown }) => {
      const state = { location: { search: {} } };
      return opts?.select ? opts.select(state) : state;
    },
    Link: ({ children, to }: { children: React.ReactNode; to?: string }) => (
      <a href={to ?? "#"}>{children}</a>
    ),
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

function makeStudentView(id: bigint, name: string): StudentView {
  return {
    student: {
      id,
      name,
      identifier: `id-${id}`,
      createdAt: 1n,
      watermarkEnabled: false,
    },
    grantedClasses: [],
    progress: {
      studentId: id,
      completedClasses: [],
      remainingSeconds: 0n,
    },
  };
}

/** Seed a restored admin session so the console treats the caller as admin. */
function seedAdminSession(actor: ReturnType<typeof createMockBackend>) {
  window.sessionStorage.setItem("hypnotism.session", "tok-admin");
  actor.getSession = vi.fn().mockResolvedValue({
    role: Role.admin,
    issuedAt: 1n,
  });
}

beforeEach(() => {
  navigate.mockReset();
  setMockActor(null);
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe("admin console access", () => {
  it("shows the denied state and redirects a non-admin caller", async () => {
    setMockActor(createMockBackend());
    renderWithProviders(<AdminDashboardPage />);

    expect(
      await screen.findByText(/Administrator access required/i),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/admin-access" }),
    );
  });

  it("renders the console for an admin session", async () => {
    const actor = createMockBackend({
      listClasses: vi.fn().mockResolvedValue([]),
    });
    setMockActor(actor);
    seedAdminSession(actor);

    renderWithProviders(<AdminDashboardPage />);

    expect(await screen.findByText("Manage Your Academy")).toBeInTheDocument();
    expect(screen.getAllByText("Classes").length).toBeGreaterThan(0);
  });
});

describe("class management", () => {
  it("creates a class through the backend with the entered bilingual fields", async () => {
    const user = userEvent.setup();
    const created = makeClass(1n, 1n, "Foundations");
    const actor = createMockBackend({
      listClasses: vi.fn().mockResolvedValue([]),
      createClass: vi.fn().mockResolvedValue(created),
    });
    setMockActor(actor);

    renderWithProviders(<ClassManager />);

    await user.click(await screen.findByRole("button", { name: /New class/i }));
    await user.type(screen.getByLabelText(/Title \(English\)/i), "Foundations");
    await user.type(screen.getByLabelText(/Title \(Malayalam\)/i), "അടിസ്ഥാനങ്ങൾ");
    await user.click(screen.getByRole("button", { name: /Save class/i }));

    await waitFor(() =>
      expect(actor.createClass).toHaveBeenCalledWith({
        titleEn: "Foundations",
        titleMl: "അടിസ്ഥാനങ്ങൾ",
        descriptionEn: "",
        descriptionMl: "",
        published: false,
      }),
    );
  });

  it("lists existing classes with their published state", async () => {
    const actor = createMockBackend({
      listClasses: vi
        .fn()
        .mockResolvedValue([makeClass(1n, 1n, "Foundations")]),
    });
    setMockActor(actor);

    renderWithProviders(<ClassManager />);

    expect(await screen.findByText("Foundations")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
  });
});

describe("student access management", () => {
  it("grants a student access to a class through the backend", async () => {
    const user = userEvent.setup();
    const actor = createMockBackend({
      listStudents: vi.fn().mockResolvedValue([makeStudentView(1n, "Ada")]),
      listClasses: vi
        .fn()
        .mockResolvedValue([makeClass(7n, 1n, "Foundations")]),
      grantClassAccess: vi.fn().mockResolvedValue(true),
    });
    setMockActor(actor);

    renderWithProviders(<StudentManager />);

    await user.click(await screen.findByRole("button", { name: /Manage/i }));
    await user.click(await screen.findByRole("button", { name: /^Grant$/i }));

    await waitFor(() =>
      expect(actor.grantClassAccess).toHaveBeenCalledWith(1n, 7n),
    );
  });
});
