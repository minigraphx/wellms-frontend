import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginForm } from "../app/components/LoginForm";

const login = jest.fn();

jest.mock("@escolalms/sdk/lib/react/context", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return { EscolaLMSContext: React.createContext({ login: (...args: unknown[]) => login(...args) }) };
});

function submit(email = "anna@example.com", password = "secret123") {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
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

    expect(await screen.findByText(/confirm your email address/i)).toBeInTheDocument();
    expect(screen.queryByText(/invalid email or password/i)).toBeNull();
  });

  it("explains a deactivated account", async () => {
    login.mockResolvedValue({ data: { message: "User account has been deactivated" } });
    render(<LoginForm />);

    submit();

    expect(await screen.findByText(/account has been deactivated/i)).toBeInTheDocument();
  });

  it("reports wrong credentials", async () => {
    login.mockResolvedValue({ data: { message: "Invalid credentials" } });
    render(<LoginForm />);

    submit();

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
