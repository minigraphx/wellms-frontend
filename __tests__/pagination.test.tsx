import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

jest.mock("../app/components/Nav", () => ({
  Nav: () => <nav data-testid="nav" />,
}));

jest.mock("../app/components/CourseCard", () => ({
  CourseCard: ({ course }: { course: { id: number; title: string } }) => (
    <div data-testid="course-card">{course.title}</div>
  ),
}));

jest.mock("@escolalms/sdk/lib/react/context", () => {
  const React = require("react");
  const EscolaLMSContext = React.createContext({});
  return { EscolaLMSContext };
});

import Home from "../app/page";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";

const makeCourse = (id: number) => ({
  id,
  title: `Course ${id}`,
  image_url: null,
  summary: null,
  level: null,
  topic_count: 5,
  author: null,
});

const page1Courses = Array.from({ length: 9 }, (_, i) => makeCourse(i + 1));

function makeContext(hasMore: boolean, fetchCourses = jest.fn()) {
  return {
    courses: {
      loading: false,
      list: {
        data: page1Courses,
        meta: {
          current_page: 1,
          last_page: hasMore ? 2 : 1,
          per_page: 9,
          total: hasMore ? 12 : 9,
        },
      },
    },
    fetchCourses,
    user: { value: null },
    categoryTree: { list: [] },
    fetchCategories: jest.fn(),
    myCourses: { value: [] },
    fetchMyCourses: jest.fn(),
  };
}

describe("Homepage pagination", () => {
  it("hides Load more when on last page", async () => {
    render(
      <EscolaLMSContext.Provider value={makeContext(false) as any}>
        <Home />
      </EscolaLMSContext.Provider>
    );

    await waitFor(() => expect(screen.getAllByTestId("course-card")).toHaveLength(9));
    expect(screen.queryByTestId("load-more")).not.toBeInTheDocument();
  });

  it("shows Load more when more pages exist", async () => {
    render(
      <EscolaLMSContext.Provider value={makeContext(true) as any}>
        <Home />
      </EscolaLMSContext.Provider>
    );

    await waitFor(() => expect(screen.getByTestId("load-more")).toBeInTheDocument());
  });

  it("calls fetchCourses with page: 2 when Load more is clicked", async () => {
    const fetchCourses = jest.fn();
    const user = userEvent.setup();

    render(
      <EscolaLMSContext.Provider value={makeContext(true, fetchCourses) as any}>
        <Home />
      </EscolaLMSContext.Provider>
    );

    await waitFor(() => screen.getByTestId("load-more"));
    await user.click(screen.getByTestId("load-more"));

    expect(fetchCourses).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });
});
