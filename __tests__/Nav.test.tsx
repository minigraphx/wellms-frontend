import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ refresh: mockRefresh }),
}));

jest.mock("../app/components/LoginForm", () => ({
  LoginForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess}>Mock login</button>
  ),
}));

jest.mock("../app/components/NotificationBell", () => ({ NotificationBell: () => null }));

jest.mock("@escolalms/sdk/lib/react/context", () => {
  const React = require("react");
  const EscolaLMSContext = React.createContext({
    user: { value: null },
    logout: jest.fn(),
    fetchMyCourses: jest.fn(),
  });
  return { EscolaLMSContext };
});

import { Nav } from "../app/components/Nav";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";

const loggedInValue = {
  user: {
    value: { id: 1, email: "jane@example.com", first_name: "Jane", last_name: "Doe" },
  },
  logout: jest.fn(),
  fetchMyCourses: jest.fn(),
  fetchCart: jest.fn(),
  cart: { value: null },
};

describe("Nav — desktop", () => {
  it("shows the sign-in button in German by default", () => {
    render(<Nav />);
    expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
  });
});

describe("Nav — mobile hamburger", () => {
  it("renders the hamburger open button", () => {
    render(<Nav />);
    expect(screen.getByRole("button", { name: "Menü öffnen" })).toBeInTheDocument();
  });

  it("opens the mobile menu when hamburger is clicked", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));

    expect(screen.getByRole("button", { name: "Menü schliessen" })).toBeInTheDocument();
    expect(screen.getByText("Konto erstellen")).toBeInTheDocument();
  });

  it("closes the mobile menu on second click", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));
    await user.click(screen.getByRole("button", { name: "Menü schliessen" }));

    expect(screen.queryByText("Konto erstellen")).not.toBeInTheDocument();
  });

  it("shows My courses and Sign out in mobile menu when logged in", async () => {
    const user = userEvent.setup();
    render(
      <EscolaLMSContext.Provider value={loggedInValue as any}>
        <Nav />
      </EscolaLMSContext.Provider>
    );

    await user.click(screen.getByRole("button", { name: "Menü öffnen" }));

    expect(screen.getAllByText("Meine Kurse").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Abmelden" })).toBeInTheDocument();
  });
});

describe("Nav — language", () => {
  it("stores the chosen language in a cookie and re-renders the page", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    await user.click(screen.getByRole("button", { name: "en" }));

    expect(document.cookie).toContain("lang=en");
    expect(mockRefresh).toHaveBeenCalled();
  });
});
