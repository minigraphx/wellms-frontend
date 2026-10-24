import robots from "../app/robots";
import sitemap from "../app/sitemap";

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

function page(data: unknown[], current: number, last: number) {
  return { ok: true, json: async () => ({ success: true, data, meta: { current_page: current, last_page: last } }) };
}

describe("sitemap", () => {
  it("lists the catalogue and every public course under its slug, across pages", async () => {
    fetchMock
      .mockResolvedValueOnce(page([{ id: 2, title: "ChatGPT & Co.: Einstiegskurs KI", updated_at: "2026-10-23T23:56:19Z" }], 1, 2))
      .mockResolvedValueOnce(page([{ id: 14, title: "Car Modelling", updated_at: null }], 2, 2));

    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toEqual([
      "http://localhost:3000/",
      "http://localhost:3000/courses/2-chatgpt-co-einstiegskurs-ki",
      "http://localhost:3000/courses/14-car-modelling",
    ]);
    expect(entries[1].lastModified).toEqual(new Date("2026-10-23T23:56:19Z"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("still returns the catalogue when the API is down", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    jest.spyOn(console, "error").mockImplementation(() => {});

    const entries = await sitemap();

    expect(entries.map((e) => e.url)).toEqual(["http://localhost:3000/"]);
  });
});

describe("robots", () => {
  it("allows the public pages, hides the private ones and points to the sitemap", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;

    expect(rules.allow).toBe("/");
    expect(rules.disallow).toEqual(expect.arrayContaining(["/dashboard", "/checkout", "/courses/*/topics/"]));
    expect(result.sitemap).toBe("http://localhost:3000/sitemap.xml");
  });
});
