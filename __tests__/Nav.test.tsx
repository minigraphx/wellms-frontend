import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

jest.mock("../app/components/LoginForm", () => ({
  LoginForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess}>Mock login</button>
  ),
}));

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
};

describe("Nav — desktop", () => {
  it("shows Sign in button when logged out", () => {
    render(<Nav />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});

describe("Nav — mobile hamburger", () => {
  it("renders the hamburger open button", () => {
    render(<Nav />);
    expect(screen.getByRole("button", { name: /open menu/i })).toBeInTheDocument();
  });

  it("opens the mobile menu when hamburger is clicked", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.getByRole("button", { name: /close menu/i })).toBeInTheDocument();
    expect(screen.getByText("Create account")).toBeInTheDocument();
  });

  it("closes the mobile menu on second click", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    await user.click(screen.getByRole("button", { name: /close menu/i }));

    expect(screen.queryByText("Create account")).not.toBeInTheDocument();
  });

  it("shows My courses and Sign out in mobile menu when logged in", async () => {
    const user = userEvent.setup();
    render(
      <EscolaLMSContext.Provider value={loggedInValue as any}>
        <Nav />
      </EscolaLMSContext.Provider>
    );

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.getAllByText("My courses").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });
});
