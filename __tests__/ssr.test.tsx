import { renderToString } from "react-dom/server";
import { messages } from "../app/i18n/messages";

// What search engines get: the HTML rendered on the server, before any effect or API call.

jest.mock("next/navigation", () => ({ usePathname: () => "/" }));
jest.mock("../app/components/Nav", () => ({ Nav: () => <nav /> }));
jest.mock("../app/components/Toast", () => ({ useToast: () => ({ toast: jest.fn() }) }));

jest.mock("@escolalms/sdk/lib/react/context", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    EscolaLMSContext: React.createContext({
      // fresh SDK state on the server: nothing loaded yet, nobody logged in
      token: null,
      user: { value: null },
      courses: { loading: true, list: undefined },
      course: { value: undefined },
      program: { value: undefined },
      categoryTree: { list: [] },
      myCourses: { value: null },
      courseProgressDetails: {},
      fetchCourses: jest.fn(),
      fetchCategories: jest.fn(),
      fetchMyCourses: jest.fn(),
      fetchCourse: jest.fn(),
      fetchProgram: jest.fn(),
      fetchCourseProgress: jest.fn(),
      fetchMyProducts: jest.fn(),
      addCourseAccess: jest.fn(),
    }),
  };
});

import HomeClient from "../app/HomeClient";
import CoursePageClient from "../app/courses/[id]/CoursePageClient";

const course = {
  id: 2,
  title: "ChatGPT & Co.: Einstiegskurs KI",
  summary: "Wie sollten wir **KI** verwenden",
  level: "Einfach",
  topic_count: 5,
  image_url: null,
  author: null,
  lessons: [{ id: 10, title: "Lektion 1", topics: [{ id: 25, title: "1.1 Willkommen", preview: true }] }],
};

describe("server-rendered HTML", () => {
  it("lists the catalogue courses with links to their slug pages", () => {
    const html = renderToString(<HomeClient initialCourses={[course] as never} />);

    expect(html).toContain("ChatGPT &amp; Co.: Einstiegskurs KI");
    expect(html).toContain('href="/courses/2-chatgpt-co-einstiegskurs-ki"');
    expect(html).not.toContain("Loading...");
    expect(html).not.toContain(messages.de.common.loading);
  });

  it("contains the course title, summary and curriculum", () => {
    const html = renderToString(<CoursePageClient courseId={2} initialCourse={course as never} />);

    expect(html).toContain("<h1");
    expect(html).toContain("ChatGPT &amp; Co.: Einstiegskurs KI");
    expect(html).toContain("<strong>KI</strong>");
    expect(html).toContain("1.1 Willkommen");
    expect(html).not.toContain("Loading...");
    expect(html).not.toContain(messages.de.common.loading);
  });
});
