import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RegisterForm } from "../app/components/RegisterForm";

const register = jest.fn();
const login = jest.fn();
const push = jest.fn();

jest.mock("@escolalms/sdk/lib/react/context", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    EscolaLMSContext: React.createContext({
      register: (...args: unknown[]) => register(...args),
      login: (...args: unknown[]) => login(...args),
    }),
  };
});

jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText("Vorname"), { target: { value: "Anna" } });
  fireEvent.change(screen.getByLabelText("Nachname"), { target: { value: "Muster" } });
  fireEvent.change(screen.getByLabelText("E-Mail"), { target: { value: "anna@example.com" } });
  fireEvent.change(screen.getByLabelText("Passwort"), { target: { value: "secret123" } });
  fireEvent.change(screen.getByLabelText("Passwort bestätigen"), { target: { value: "secret123" } });
  fireEvent.click(screen.getByRole("button", { name: /konto erstellen/i }));
}

describe("RegisterForm", () => {
  beforeEach(() => {
    register.mockReset();
    login.mockReset();
    push.mockReset();
  });

  it("goes to the dashboard when the new account can log in right away", async () => {
    register.mockResolvedValue({ success: true });
    login.mockResolvedValue({ success: true, data: { token: "t" } });
    render(<RegisterForm />);

    fillAndSubmit();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
  });

  it("tells the user to confirm their email instead of silently redirecting", async () => {
    register.mockResolvedValue({ success: true });
    login.mockResolvedValue({ data: { message: "Email not validated" } });
    render(<RegisterForm />);

    fillAndSubmit();

    expect(await screen.findByText(/schau in dein postfach/i)).toBeInTheDocument();
    expect(screen.getByText(/anna@example\.com/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the API message when registration fails", async () => {
    register.mockResolvedValue({ data: { message: "The email has already been taken." } });
    render(<RegisterForm />);

    fillAndSubmit();

    expect(await screen.findByText("The email has already been taken.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
});
