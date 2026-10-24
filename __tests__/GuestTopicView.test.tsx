import { render, screen, waitFor } from "@testing-library/react";
import { TopicType } from "@escolalms/sdk/lib/types/enums";
import { GuestTopicView } from "../app/components/GuestTopicView";

const fetchCourse = jest.fn();

const mockCourse = {
  id: 2,
  title: "ChatGPT & Co.: Einstiegskurs KI",
  lessons: [
    {
      id: 10,
      title: "Lektion 1",
      topics: [
        { id: 26, title: "1.2 ChatGPT und andere", preview: true, topicable_type: TopicType.RichText },
        { id: 27, title: "1.3 Konto erstellen", preview: false, topicable_type: TopicType.RichText },
      ],
    },
  ],
};

jest.mock("@escolalms/sdk/lib/react/context", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    EscolaLMSContext: React.createContext({
      apiUrl: "https://api.example.com",
      fetchCourse: (...args: unknown[]) => fetchCourse(...args),
      get course() {
        return { value: mockCourse };
      },
      fetchH5P: jest.fn(),
      h5p: { value: null },
    }),
  };
});

jest.mock("@escolalms/sdk/lib/react", () => ({ SCORMPlayer: () => null }));

const fetchMock = jest.fn();

beforeEach(() => {
  fetchCourse.mockReset().mockResolvedValue({ success: true, data: mockCourse });
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("GuestTopicView", () => {
  it("loads and shows a free preview lesson from the public preview endpoint", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { ...mockCourse.lessons[0].topics[0], topicable: { value: "## Was ist ChatGPT?\n\nEin Sprachmodell." } },
      }),
    });

    render(<GuestTopicView courseId={2} topicId={26} />);

    expect(await screen.findByRole("heading", { level: 2, name: "Was ist ChatGPT?" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/api/courses/2/preview/26", expect.anything());
    expect(fetchCourse).toHaveBeenCalledWith(2);
    expect(screen.getByRole("link", { name: /melde dich an/i })).toBeInTheDocument();
  });

  it("asks guests to sign in for lessons that are not a free preview", async () => {
    render(<GuestTopicView courseId={2} topicId={27} />);

    expect(await screen.findByText(/melde dich an oder erstelle ein konto/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1.3 Konto erstellen" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says so when the lesson is not part of the course", async () => {
    render(<GuestTopicView courseId={2} topicId={999} />);

    expect(await screen.findByText(/lektion nicht gefunden/i)).toBeInTheDocument();
  });

  it("shows an error when the preview cannot be loaded", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ success: false }) });

    render(<GuestTopicView courseId={2} topicId={26} />);

    await waitFor(() => expect(screen.getByText(/konnten diese lektion nicht laden/i)).toBeInTheDocument());
  });
});
