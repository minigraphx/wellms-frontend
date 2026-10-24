import {
  breadcrumbJsonLd,
  courseJsonLd,
  coursePath,
  courseSlug,
  jsonLdScript,
  metaDescription,
  parseCourseId,
} from "../app/lib/seo";

const course = {
  id: 2,
  title: "ChatGPT & Co.: Einstiegskurs KI",
  summary: "## Wie sollten wir KI verwenden\n\n**Systemnachrichten** und [Über mich](https://example.com)",
  language: "de",
  image_url: "https://api.example.com/storage/course/2/cover.jpg",
  author: { first_name: "Andreas", last_name: "Schmidt" },
};

describe("course slugs", () => {
  it("builds a readable slug with the id in front", () => {
    expect(courseSlug(course)).toBe("2-chatgpt-co-einstiegskurs-ki");
    expect(courseSlug({ id: 7, title: "Übungen für Ärzte – Größe" })).toBe("7-uebungen-fuer-aerzte-groesse");
    expect(coursePath(course)).toBe("/courses/2-chatgpt-co-einstiegskurs-ki");
  });

  it("falls back to the id when the title has no usable characters", () => {
    expect(courseSlug({ id: 9, title: "!!!" })).toBe("9");
  });

  it("parses the id from numeric and slug params", () => {
    expect(parseCourseId("2")).toBe(2);
    expect(parseCourseId("2-chatgpt-co-einstiegskurs-ki")).toBe(2);
    expect(parseCourseId("abc")).toBeNull();
    expect(parseCourseId("0")).toBeNull();
  });
});

describe("metaDescription", () => {
  it("turns Markdown into plain text", () => {
    expect(metaDescription(course.summary)).toBe("Wie sollten wir KI verwenden Systemnachrichten und Über mich");
  });

  it("cuts long text at a word boundary with an ellipsis", () => {
    const text = "Wort ".repeat(60);
    const result = metaDescription(text, 50);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toMatch(/\s…$/);
  });

  it("returns an empty string for missing text", () => {
    expect(metaDescription(undefined)).toBe("");
  });
});

describe("JSON-LD", () => {
  it("describes the course for search engines", () => {
    const ld = courseJsonLd(course, "https://lms.example.com/courses/2-chatgpt-co-einstiegskurs-ki");

    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: "Wie sollten wir KI verwenden Systemnachrichten und Über mich",
      inLanguage: "de",
      url: "https://lms.example.com/courses/2-chatgpt-co-einstiegskurs-ki",
      image: course.image_url,
      provider: { "@type": "Organization" },
    });
  });

  it("builds the breadcrumb trail", () => {
    const ld = breadcrumbJsonLd([
      { name: "Courses", url: "https://lms.example.com/" },
      { name: course.title, url: "https://lms.example.com/courses/2-x" },
    ]);

    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Courses", item: "https://lms.example.com/" },
      { "@type": "ListItem", position: 2, name: course.title, item: "https://lms.example.com/courses/2-x" },
    ]);
  });

  it("escapes < so course text cannot close the script tag", () => {
    const html = jsonLdScript({ name: "</script><script>alert(1)</script>" });

    expect(html).not.toContain("</script>");
    expect(html).toContain("\\u003c/script>");
  });
});
