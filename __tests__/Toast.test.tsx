import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "../app/components/Toast";

function TriggerToast({ message, type }: { message: string; type?: "success" | "error" | "info" }) {
  const { toast } = useToast();
  return <button onClick={() => toast(message, type)}>Show toast</button>;
}

function setup(message: string, type?: "success" | "error" | "info") {
  return render(
    <ToastProvider>
      <TriggerToast message={message} type={type} />
    </ToastProvider>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("shows a success toast when triggered", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    setup("Saved successfully");

    await user.click(screen.getByRole("button", { name: "Show toast" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Saved successfully");
  });

  it("shows an error toast with correct styling cue", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    setup("Something went wrong", "error");

    await user.click(screen.getByRole("button", { name: "Show toast" }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong");
    expect(alert.className).toContain("bg-red-500");
  });

  it("shows an info toast", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    setup("FYI: page updated", "info");

    await user.click(screen.getByRole("button", { name: "Show toast" }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("FYI: page updated");
    expect(alert.className).toContain("bg-[#04323e]");
  });

  it("auto-dismisses after 3.5s", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    setup("Temporary message");

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(3500));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("stacks multiple toasts", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    setup("First");

    const btn = screen.getByRole("button", { name: "Show toast" });
    await user.click(btn);
    await user.click(btn);

    expect(screen.getAllByRole("alert")).toHaveLength(2);
  });
});
