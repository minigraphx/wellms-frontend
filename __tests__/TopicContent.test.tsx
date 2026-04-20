import { render, screen } from "@testing-library/react";
import { TopicContent } from "../app/components/TopicContent";
import { TopicType } from "@escolalms/sdk/lib/types/enums";
import type { API } from "@escolalms/sdk/lib";

jest.mock("@escolalms/sdk/lib/react/context", () => {
  const React = require("react");
  const EscolaLMSContext = React.createContext({
    fetchH5P: jest.fn(),
    h5p: { value: null },
    apiUrl: "http://localhost",
  });
  return { EscolaLMSContext };
});

jest.mock("@escolalms/sdk/lib/react", () => ({
  SCORMPlayer: () => <div data-testid="scorm-player" />,
}));

const makeTopic = (type: string, topicable: Record<string, unknown>): API.Topic =>
  ({ id: 1, title: "Test topic", topicable_type: type, topicable } as unknown as API.Topic);

describe("TopicContent", () => {
  it("renders 'No content available' when topicable_type is missing", () => {
    render(<TopicContent topic={{ id: 1, title: "empty" } as unknown as API.Topic} />);
    expect(screen.getByText("No content available.")).toBeInTheDocument();
  });

  it("renders rich text content as HTML", () => {
    const topic = makeTopic(TopicType.RichText, { value: "<p>Hello world</p>" });
    render(<TopicContent topic={topic} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders a video element for video topics", () => {
    const topic = makeTopic(TopicType.Video, { url: "http://example.com/video.mp4", poster_url: null });
    render(<TopicContent topic={topic} />);
    expect(document.querySelector("video")).toBeInTheDocument();
  });

  it("calls onVideoEnded when video finishes", () => {
    const onVideoEnded = jest.fn();
    const topic = makeTopic(TopicType.Video, { url: "http://example.com/video.mp4", poster_url: null });
    render(<TopicContent topic={topic} onVideoEnded={onVideoEnded} />);

    const video = document.querySelector("video")!;
    video.dispatchEvent(new Event("ended"));

    expect(onVideoEnded).toHaveBeenCalledTimes(1);
  });

  it("does not fail if onVideoEnded is not provided for video topic", () => {
    const topic = makeTopic(TopicType.Video, { url: "http://example.com/video.mp4", poster_url: null });
    expect(() => render(<TopicContent topic={topic} />)).not.toThrow();
  });

  it("renders image for image topics", () => {
    const topic = makeTopic(TopicType.Image, { url: "http://example.com/img.png" });
    render(<TopicContent topic={topic} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "http://example.com/img.png");
  });

  it("renders audio element for audio topics", () => {
    const topic = makeTopic(TopicType.Audio, { url: "http://example.com/audio.mp3" });
    render(<TopicContent topic={topic} />);
    expect(document.querySelector("audio")).toBeInTheDocument();
  });

  it("shows unsupported message for unknown topic types", () => {
    const topic = makeTopic("unknown_type", {});
    render(<TopicContent topic={topic} />);
    expect(screen.getByText(/not yet supported/i)).toBeInTheDocument();
  });
});
