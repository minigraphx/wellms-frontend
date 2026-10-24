import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginForm } from "../app/components/LoginForm";
import { I18nProvider } from "../app/i18n/I18nProvider";

const login = jest.fn();

jest.mock("@escolalms/sdk/lib/react/context", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return { EscolaLMSContext: React.createContext({ login: (...args: unknown[]) => login(...args) }) };
});

function submit(email = "anna@example.com", password = "secret123") {
  fireEvent.change(screen.getByLabelText("E-Mail"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Passwort"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /anmelden/i }));
}

describe("LoginForm", () => {
  beforeEach(() => login.mockReset());

  it("calls onSuccess after a successful login", async () => {
    login.mockResolvedValue({ success: true, data: { token: "t" } });
    const onSuccess = jest.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it("asks to confirm the email when the account is not verified yet", async () => {
    // SDK returns the umi-request error: the API body is in `data`
    login.mockResolvedValue({ data: { message: "Email not validated" } });
    render(<LoginForm />);

    submit();

    expect(await screen.findByText(/bestätige zuerst deine E-Mail-Adresse/i)).toBeInTheDocument();
    expect(screen.queryByText(/E-Mail oder Passwort ist falsch/i)).toBeNull();
  });

  it("explains a deactivated account", async () => {
    login.mockResolvedValue({ data: { message: "User account has been deactivated" } });
    render(<LoginForm />);

    submit();

    expect(await screen.findByText(/Konto wurde deaktiviert/i)).toBeInTheDocument();
  });

  it("reports wrong credentials", async () => {
    login.mockResolvedValue({ data: { message: "Invalid credentials" } });
    render(<LoginForm />);

    submit();

    expect(await screen.findByText(/E-Mail oder Passwort ist falsch/i)).toBeInTheDocument();
  });

  it("shows English texts when the locale is en", async () => {
    login.mockResolvedValue({ data: { message: "Invalid credentials" } });
    render(
      <I18nProvider locale="en">
        <LoginForm />
      </I18nProvider>
    );

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "anna@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
  });
});
