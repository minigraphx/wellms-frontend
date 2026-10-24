import { setApiLocale, withLocaleHeader } from "../app/i18n/apiLocale";

describe("API locale header", () => {
  afterEach(() => setApiLocale("de"));

  it("adds X-Locale with the current language and keeps existing headers", () => {
    setApiLocale("en");

    const { url, options } = withLocaleHeader("https://api.example.com/api/courses", {
      headers: { Authorization: "Bearer t" },
    });

    expect(url).toBe("https://api.example.com/api/courses");
    expect(options.headers).toEqual({ Authorization: "Bearer t", "X-Locale": "en" });
  });

  it("defaults to German", () => {
    expect(withLocaleHeader("/x", {}).options.headers).toEqual({ "X-Locale": "de" });
  });

  it("doesn't override a locale set by the caller", () => {
    expect(withLocaleHeader("/x", { headers: { "X-Locale": "pl" } }).options.headers).toEqual({ "X-Locale": "pl" });
  });
});
