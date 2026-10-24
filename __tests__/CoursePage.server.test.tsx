import { render } from "@testing-library/react";
import CoursePage, { generateMetadata } from "../app/courses/[id]/page";

const mockRedirect = jest.fn((url: string) => {
  throw new Error(`REDIRECT ${url}`);
});
const mockNotFound = jest.fn(() => {
  throw new Error("NOT_FOUND");
});

// getT() reads the language cookie; no cookie means German.
jest.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

jest.mock("next/navigation", () => ({
  permanentRedirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
}));

// The client island is covered by its own tests; here only the server part matters.
jest.mock("../app/courses/[id]/CoursePageClient", () => ({
  __esModule: true,
  default: ({ courseId, initialCourse }: { courseId: number; initialCourse: { title?: string } | null }) => (
    <div data-testid="client" data-course-id={courseId}>
      {initialCourse?.title}
    </div>
  ),
}));

const course = {
  id: 2,
  title: "ChatGPT & Co.: Einstiegskurs KI",
  summary: "Wie sollten wir **KI** verwenden",
  language: "de",
  image_url: "https://api.example.com/storage/cover.jpg",
};

const fetchMock = jest.fn();
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  fetchMock.mockReset();
  mockRedirect.mockClear();
  mockNotFound.mockClear();
  global.fetch = fetchMock as unknown as typeof fetch;
});

function apiReturns(body: unknown, ok = true) {
  fetchMock.mockResolvedValue({ ok, json: async () => body });
}

describe("course page (server)", () => {
  it("builds title, description, canonical and social previews from the course", async () => {
    apiReturns({ success: true, data: course });

    const meta = await generateMetadata(params("2-chatgpt-co-einstiegskurs-ki"));

    expect(meta.title).toBe(course.title);
    expect(meta.description).toBe("Wie sollten wir KI verwenden");
    expect(meta.alternates?.canonical).toBe("/courses/2-chatgpt-co-einstiegskurs-ki");
    expect(meta.openGraph).toMatchObject({ title: course.title, images: [{ url: course.image_url }] });
  });

  it("marks courses that aren't public as noindex", async () => {
    apiReturns({ success: false }, false);

    const meta = await generateMetadata(params("5"));

    expect(meta.robots).toMatchObject({ index: false });
  });

  it("redirects numeric and outdated URLs to the slug", async () => {
    apiReturns({ success: true, data: course });

    await expect(CoursePage(params("2"))).rejects.toThrow("REDIRECT /courses/2-chatgpt-co-einstiegskurs-ki");
  });

  it("renders the course and its JSON-LD into the HTML", async () => {
    apiReturns({ success: true, data: course });

    const { container, getByTestId } = render(await CoursePage(params("2-chatgpt-co-einstiegskurs-ki")));

    expect(getByTestId("client")).toHaveTextContent(course.title);
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(ld[0]).toMatchObject({ "@type": "Course", name: course.title, inLanguage: "de" });
    expect(ld[1]).toMatchObject({ "@type": "BreadcrumbList" });
    expect(ld[1].itemListElement[0]).toMatchObject({ position: 1, name: "Kurse" });
  });

  it("still renders the client for members when the course isn't public (drafts)", async () => {
    apiReturns({ success: false }, false);

    const { getByTestId, container } = render(await CoursePage(params("5")));

    expect(getByTestId("client")).toHaveAttribute("data-course-id", "5");
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("answers 404 for URLs without a course id", async () => {
    await expect(CoursePage(params("abc"))).rejects.toThrow("NOT_FOUND");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
