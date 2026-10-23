import { render, screen } from "@testing-library/react";
import { Markdown } from "../app/components/Markdown";

describe("Markdown", () => {
  it("renders headings, emphasis and nested lists", () => {
    render(<Markdown content={"## Kapitel\n\n- **Einstieg**\n  - Seiten öffnen\n- Navigation"} />);

    expect(screen.getByRole("heading", { level: 2, name: "Kapitel" })).toBeInTheDocument();
    expect(screen.getByText("Einstieg").tagName).toBe("STRONG");
    expect(screen.getAllByRole("list")).toHaveLength(2);
    expect(screen.getByText("Seiten öffnen")).toBeInTheDocument();
  });

  it("renders GitHub-flavoured tables", () => {
    render(<Markdown content={"| Plan | Preis |\n|---|---|\n| Basis | 10 |"} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Preis" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Basis" })).toBeInTheDocument();
  });

  it("renders links and images with their URLs", () => {
    const img = "https://api.example.com/api/images/img?path=course/13/topic/46/a.jpg&w=1000";
    render(<Markdown content={`[Mehr](https://example.com/info)\n\n![Screenshot](${img})`} />);

    expect(screen.getByRole("link", { name: "Mehr" })).toHaveAttribute("href", "https://example.com/info");
    expect(screen.getByRole("img", { name: "Screenshot" })).toHaveAttribute("src", img);
  });

  it("still renders legacy HTML content", () => {
    render(<Markdown content={"<p>Hello <em>world</em></p>"} />);

    expect(screen.getByText("world").tagName).toBe("EM");
  });

  it("removes scripts, event handlers and javascript: links", () => {
    const { container } = render(
      <Markdown
        content={
          '<script>window.__xss = 1</script>\n\n<img src="x" onerror="window.__xss = 2">\n\n<a href="javascript:alert(1)">klick</a>\n\n[md](javascript:alert(2))'
        }
      />
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    container.querySelectorAll("a").forEach((a) => {
      expect(a.getAttribute("href") ?? "").not.toMatch(/^javascript:/i);
    });
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();
  });

  it("renders nothing for empty content", () => {
    const { container } = render(<Markdown content="" />);

    expect(container.textContent).toBe("");
  });
});
