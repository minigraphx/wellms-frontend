import { render, screen, waitFor } from "@testing-library/react";
import CoursePage from "../app/courses/[id]/page";

const fetchCourse = jest.fn();
const fetchProgram = jest.fn();

const mockPublicCourse = {
  id: 2,
  title: "ChatGPT & Co.: Einstiegskurs KI",
  summary: "Wie sollten wir KI verwenden",
  lessons: [
    {
      id: 10,
      title: "Lektion 1",
      topics: [
        { id: 25, title: "1.1 Willkommen", preview: true },
        { id: 27, title: "1.3 Konto erstellen", preview: false },
      ],
    },
  ],
};

jest.mock("next/navigation", () => ({ useParams: () => ({ id: "2" }) }));

jest.mock("@escolalms/sdk/lib/react/context", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    EscolaLMSContext: React.createContext({
      token: null,
      user: { value: null },
      fetchCourse: (...args: unknown[]) => fetchCourse(...args),
      get course() {
        return { value: mockPublicCourse };
      },
      fetchProgram: (...args: unknown[]) => fetchProgram(...args),
      program: { value: null },
      fetchCourseProgress: jest.fn(),
      courseProgressDetails: {},
      addCourseAccess: jest.fn(),
      fetchMyCourses: jest.fn(),
      myCourses: { value: null },
      fetchMyProducts: jest.fn(),
    }),
  };
});

jest.mock("../app/components/Toast", () => ({ useToast: () => ({ toast: jest.fn() }) }));

describe("CoursePage for guests", () => {
  beforeEach(() => {
    fetchCourse.mockReset().mockResolvedValue({ success: true, data: mockPublicCourse });
    fetchProgram.mockReset();
  });

  it("shows the public course instead of a sign-in wall", async () => {
    render(<CoursePage />);

    expect(await screen.findByRole("heading", { level: 1, name: mockPublicCourse.title })).toBeInTheDocument();
    expect(fetchCourse).toHaveBeenCalledWith(2);
    expect(fetchProgram).not.toHaveBeenCalled();
    expect(screen.queryByText(/sign in to view this course/i)).toBeNull();
    expect(screen.getByText(/to enroll/i)).toBeInTheDocument();
  });

  it("links free preview lessons and keeps the others locked", async () => {
    render(<CoursePage />);

    await waitFor(() => expect(screen.getByText("1.1 Willkommen")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /1\.1 Willkommen/ })).toHaveAttribute("href", "/courses/2/topics/25");
    expect(screen.queryByRole("link", { name: /1\.3 Konto erstellen/ })).toBeNull();
  });
});
