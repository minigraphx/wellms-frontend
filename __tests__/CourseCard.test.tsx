import { render, screen } from "@testing-library/react";
import { CourseCard } from "../app/components/CourseCard";
import type { API } from "@escolalms/sdk/lib";

const baseCourse: API.CourseListItem = {
  id: 1,
  title: "Intro to TypeScript",
  summary: "Learn TypeScript from scratch.",
  image_url: null,
  level: "beginner",
  topic_count: 10,
  author: { first_name: "Jane", last_name: "Doe" } as API.UserItem,
} as unknown as API.CourseListItem;

describe("CourseCard", () => {
  it("renders course title and author", () => {
    render(<CourseCard course={baseCourse} />);
    expect(screen.getByText("Intro to TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("does not show enrolled badge when isEnrolled is false", () => {
    render(<CourseCard course={baseCourse} isEnrolled={false} />);
    expect(screen.queryByTestId("enrolled-badge")).not.toBeInTheDocument();
  });

  it("shows 'In Progress' badge when enrolled and progress < 100", () => {
    render(<CourseCard course={baseCourse} isEnrolled progressPct={45} />);
    expect(screen.getByTestId("enrolled-badge")).toHaveTextContent("In Progress");
  });

  it("shows 'Completed' badge when enrolled and progress is 100", () => {
    render(<CourseCard course={baseCourse} isEnrolled progressPct={100} />);
    expect(screen.getByTestId("enrolled-badge")).toHaveTextContent("✓ Completed");
  });

  it("renders a progress bar when enrolled with progressPct", () => {
    render(<CourseCard course={baseCourse} isEnrolled progressPct={60} />);
    const bar = document.querySelector("[style]");
    expect(bar).toBeTruthy();
  });

  it("shows level and topic count chips", () => {
    render(<CourseCard course={baseCourse} />);
    expect(screen.getByText("beginner")).toBeInTheDocument();
    expect(screen.getByText("10 lessons")).toBeInTheDocument();
  });

  it("links to the correct course URL", () => {
    render(<CourseCard course={baseCourse} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/courses/1");
  });
});
