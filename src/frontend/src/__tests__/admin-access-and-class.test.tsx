import { MediaKind, Role } from "@/backend";
import { Header } from "@/components/Header";
import { Logo } from "@/components/Logo";
import { MediaViewer } from "@/components/MediaViewer";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import { ClassViewerPage } from "@/pages/ClassViewerPage";
import {
  createMockBackend,
  mockActorState,
  renderWithProviders,
  setMockActor,
} from "@/test/test-utils";
import type {
  Class,
  Lesson,
  StudentClassView,
  StudentDashboard,
} from "@/types";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn();
const routeParams: { id?: string } = {};

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => navigate,
    useParams: () => routeParams,
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
  return {
    studentId: 1n,
    classes,
    totalCount: BigInt(classes.length),
    completedCount: BigInt(classes.filter((c) => c.completed).length),
    remainingSeconds: 0n,
    ...overrides,
  };
}

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
  routeParams.id = undefined;
  setMockActor(null);
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe("logo triple-tap", () => {
  it("navigates to the admin access page after three taps", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Logo />);

    const logo = screen.getByRole("button", { name: /HYPNOTISM home/i });
    await user.click(logo);
    await user.click(logo);
    expect(navigate).not.toHaveBeenCalled();

    await user.click(logo);
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/admin-access" }),
    );
  });

  it("does not navigate on a single tap", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Logo />);

    await user.click(screen.getByRole("button", { name: /HYPNOTISM home/i }));
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("language switcher", () => {
  it("switches visible interface text between English and Malayalam", async () => {
    const user = userEvent.setup();
    setMockActor(createMockBackend());
    renderWithProviders(<Header />);

    // English by default.
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Switch language/i }));

    expect(await screen.findByText("ഹോം")).toBeInTheDocument();
    expect(screen.getByText("സൈൻ ഇൻ")).toBeInTheDocument();
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });
});

describe("class viewer", () => {
  it("completes a class and shows the 24-hour countdown for the next class", async () => {
    const user = userEvent.setup();
    const classInfo = makeClass(1n, 1n, "Foundations");
    const countdownEndsAt =
      BigInt(Date.now() + 24 * 60 * 60 * 1000) * 1_000_000n;
    const actor = createMockBackend({
      resolveStudent: vi.fn().mockResolvedValue({
        id: 1n,
        name: "Ada",
        identifier: "ada-01",
        watermarkEnabled: false,
      }),
      // First load: not yet completed. After completion the dashboard refetch
      // reports the class completed with the server countdown end time.
      getStudentDashboard: vi
        .fn()
        .mockResolvedValueOnce(makeDashboard([makeView(classInfo)]))
        .mockResolvedValue(
          makeDashboard([
            makeView(classInfo, { completed: true, countdownEndsAt }),
          ]),
        ),
      getClass: vi.fn().mockResolvedValue(classInfo),
      listLessons: vi.fn().mockResolvedValue([]),
      completeClass: vi.fn().mockResolvedValue({
        __kind__: "ok",
        ok: { countdownEndsAt },
      }),
    });
    setMockActor(actor);
    seedStudentSession(actor);
    routeParams.id = "1";

    renderWithProviders(<ClassViewerPage />);

    const completeButton = await screen.findByRole("button", {
      name: /Complete Class/i,
    });
    await user.click(completeButton);

    await waitFor(() =>
      expect(actor.completeClass).toHaveBeenCalledWith(1n, 1n),
    );
    // The completed state surfaces the countdown for the next class.
    expect(await screen.findByRole("timer")).toBeInTheDocument();
  });

  it("shows the locked state with a countdown for a locked class", async () => {
    const classInfo = makeClass(2n, 2n, "Conversational");
    const countdownEndsAt = BigInt(Date.now() + 3_600_000) * 1_000_000n;
    const actor = createMockBackend({
      resolveStudent: vi.fn().mockResolvedValue({
        id: 1n,
        name: "Ada",
        identifier: "ada-01",
        watermarkEnabled: false,
      }),
      getStudentDashboard: vi.fn().mockResolvedValue(
        makeDashboard([
          makeView(classInfo, {
            locked: true,
            countdownEndsAt,
            remainingSeconds: 3600n,
          }),
        ]),
      ),
      getClass: vi.fn().mockResolvedValue(classInfo),
      listLessons: vi.fn().mockResolvedValue([]),
    });
    setMockActor(actor);
    seedStudentSession(actor);
    routeParams.id = "2";

    renderWithProviders(<ClassViewerPage />);

    expect(
      await screen.findByText(/This class is locked/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("timer")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Complete Class/i }),
    ).not.toBeInTheDocument();
  });
});

describe("protected media", () => {
  it("renders authorized media with a watermark and no download control", async () => {
    const lesson: Lesson = {
      id: 5n,
      classId: 1n,
      order: 1n,
      titleEn: "Lesson",
      titleMl: "Lesson (ml)",
      bodyEn: "Body",
      bodyMl: "Body (ml)",
      poster: {
        id: 8n,
        blob: new Uint8Array([9, 9, 9]),
        kind: MediaKind.poster,
        name: "poster.png",
        mimeType: "image/png",
        uploadedAt: 1n,
      },
      files: [
        {
          id: 9n,
          blob: new Uint8Array([1, 2, 3]),
          kind: MediaKind.file,
          name: "handout.pdf",
          mimeType: "application/pdf",
          uploadedAt: 1n,
        },
      ],
    };
    const actor = createMockBackend({
      getAuthorizedLessonMedia: vi.fn().mockResolvedValue(lesson),
    });
    setMockActor(actor);
    seedStudentSession(actor);

    renderWithProviders(
      <MediaViewer
        lessonId={5n}
        studentId={1n}
        watermarkEnabled
        identifier="ada-01"
      />,
    );

    expect(await screen.findByText("handout.pdf")).toBeInTheDocument();
    // The file is marked protected and exposes no download link.
    expect(screen.getByText("Protected")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /download/i }),
    ).not.toBeInTheDocument();
    // The watermark overlays the student's identifier on the poster.
    const watermark = document.querySelector('[data-ocid="media.watermark"]');
    expect(watermark).not.toBeNull();
    expect(watermark).toHaveAttribute("aria-hidden", "true");
  });

  it("shows the not-authorized state when media is unavailable", async () => {
    const actor = createMockBackend({
      getAuthorizedLessonMedia: vi.fn().mockResolvedValue(null),
    });
    setMockActor(actor);
    seedStudentSession(actor);

    renderWithProviders(
      <MediaViewer
        lessonId={5n}
        studentId={1n}
        watermarkEnabled={false}
        identifier="ada-01"
      />,
    );

    await waitFor(() =>
      expect(actor.getAuthorizedLessonMedia).toHaveBeenCalled(),
    );
    expect(
      await screen.findByText(/Protected media is unavailable/i),
    ).toBeInTheDocument();
  });
});

describe("watermark overlay", () => {
  it("tiles the student identifier and is hidden from assistive tech", () => {
    renderWithProviders(<WatermarkOverlay identifier="ada-01" />);

    const overlay = document.querySelector('[data-ocid="media.watermark"]');
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByText("ada-01").length).toBeGreaterThan(0);
  });
});
