import { render, screen } from "@testing-library/react";
import { I18nProvider, useFormat, useLocale, useT } from "../app/i18n/I18nProvider";
import { messages } from "../app/i18n/messages";
import { resolveLocale } from "../app/i18n/config";

function Probe() {
  const t = useT();
  const locale = useLocale();
  const { date, number } = useFormat();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="signIn">{t.common.signIn}</span>
      <span data-testid="lessons">{t.common.lessonCount(2)}</span>
      <span data-testid="date">{date("2026-10-24T10:00:00Z")}</span>
      <span data-testid="number">{number(1234.5)}</span>
    </div>
  );
}

describe("i18n", () => {
  it("defaults to German", () => {
    render(<Probe />);

    expect(screen.getByTestId("locale")).toHaveTextContent("de");
    expect(screen.getByTestId("signIn")).toHaveTextContent("Anmelden");
    expect(screen.getByTestId("lessons")).toHaveTextContent("2 Lektionen");
  });

  it("formats dates and numbers the Swiss way in German", () => {
    render(<Probe />);

    expect(screen.getByTestId("date")).toHaveTextContent("24.10.2026");
    expect(screen.getByTestId("number")).toHaveTextContent(/1.?234[.,]5/);
    expect(screen.getByTestId("number").textContent).toBe(new Intl.NumberFormat("de-CH").format(1234.5));
  });

  it("switches everything to English", () => {
    render(
      <I18nProvider locale="en">
        <Probe />
      </I18nProvider>
    );

    expect(screen.getByTestId("signIn")).toHaveTextContent("Sign in");
    expect(screen.getByTestId("lessons")).toHaveTextContent("2 lessons");
  });

  it("uses singular forms for one", () => {
    render(<Probe />);
    expect(messages.de.common.lessonCount(1)).toBe("1 Lektion");
    expect(messages.en.common.lessonCount(1)).toBe("1 lesson");
  });

  it("falls back to German for unknown or missing cookie values", () => {
    expect(resolveLocale(undefined)).toBe("de");
    expect(resolveLocale("fr")).toBe("de");
    expect(resolveLocale("en")).toBe("en");
  });

  it("has the same keys in every language", () => {
    const shape = (value: unknown): unknown =>
      typeof value === "object" && value !== null
        ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]))
        : typeof value;
    expect(shape(messages.en)).toEqual(shape(messages.de));
  });
});
