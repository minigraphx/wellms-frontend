"use client";

import { useContext, useEffect, useRef, useState } from "react";
import type { API } from "@escolalms/sdk/lib";
import { TopicType } from "@escolalms/sdk/lib/types/enums";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { SCORMPlayer } from "@escolalms/sdk/lib/react";
import { ProjectUpload } from "./ProjectUpload";
import { GiftQuizPlayer } from "./GiftQuizPlayer";

interface TopicContentProps {
  topic: API.Topic;
  onVideoEnded?: () => void;
  onComplete?: () => void;
  onWatchedEnough?: () => void;
  onPass?: () => void;
}

function H5PPlayer({ topic }: { topic: API.TopicH5P }) {
  const { fetchH5P, h5p, apiUrl } = useContext(EscolaLMSContext);
  const uuid = topic.topicable.content.uuid;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchH5P(uuid);
    setLoading(false);
  }, [uuid]);

  const h5pData = h5p?.value;
  const embedUrl = h5pData?.url
    ? h5pData.url
    : `${apiUrl}/api/hh5p/content/${uuid}/embed`;

  if (loading) {
    return <div className="text-gray-400 py-8 text-center">Loading H5P content…</div>;
  }

  return (
    <div className="w-full">
      <iframe
        src={embedUrl}
        className="w-full rounded-lg border border-gray-100"
        style={{ minHeight: "480px" }}
        allowFullScreen
        allow="microphone; camera; geolocation"
        title={topic.title}
      />
    </div>
  );
}

function VideoPlayer({ src, poster, onEnded, onWatchedEnough }: {
  src: string;
  poster?: string;
  onEnded?: () => void;
  onWatchedEnough?: () => void;
}) {
  const watchedFired = useRef(false);
  return (
    <video
      src={src}
      poster={poster}
      controls
      onEnded={onEnded}
      onTimeUpdate={(e) => {
        if (watchedFired.current || !onWatchedEnough) return;
        const v = e.currentTarget;
        if (v.duration > 0 && v.currentTime / v.duration >= 0.9) {
          watchedFired.current = true;
          onWatchedEnough();
        }
      }}
      className="w-full rounded-lg aspect-video bg-black"
    />
  );
}

export function TopicContent({ topic, onVideoEnded, onComplete, onWatchedEnough, onPass }: TopicContentProps) {
  if (!topic.topicable_type) {
    return <p className="text-gray-500">No content available.</p>;
  }

  switch (topic.topicable_type) {
    case TopicType.RichText:
      return (
        <div
          className="prose prose-lg max-w-none text-[#555555]"
          style={{ color: "#555555" }}
          dangerouslySetInnerHTML={{ __html: (topic as API.TopicRichText).topicable.value }}
        />
      );

    case TopicType.Video: {
      const t = topic as API.TopicVideo;
      return <VideoPlayer src={t.topicable.url} poster={t.topicable.poster_url} onEnded={onVideoEnded} onWatchedEnough={onWatchedEnough} />;
    }

    case TopicType.OEmbed: {
      const t = topic as API.TopicOEmbed;
      const val = t.topicable.value;
      if (val.startsWith("<")) {
        return <div className="aspect-video" dangerouslySetInnerHTML={{ __html: val }} />;
      }
      return (
        <iframe
          src={val}
          className="w-full rounded-lg aspect-video"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      );
    }

    case TopicType.Audio: {
      const t = topic as API.TopicAudio;
      return <audio src={t.topicable.url} controls className="w-full" />;
    }

    case TopicType.Image: {
      const t = topic as API.TopicImage;
      return <img src={t.topicable.url} alt={topic.title} className="max-w-full rounded-lg" />;
    }

    case TopicType.Pdf: {
      const t = topic as API.TopicPdf;
      return <iframe src={t.topicable.url} className="w-full h-[70vh] rounded-lg border" />;
    }

    case TopicType.H5P:
      return <H5PPlayer topic={topic as API.TopicH5P} />;

    case TopicType.Scorm: {
      const t = topic as API.TopicScorm;
      return (
        <div className="w-full">
          <SCORMPlayer uuid={t.topicable.uuid} />
          <style>{`.scorm-player, iframe { width: 100%; min-height: 600px; border: none; border-radius: 8px; }`}</style>
        </div>
      );
    }

    case TopicType.Project:
      return <ProjectUpload topicId={topic.id} topicTitle={topic.title} />;

    case TopicType.GiftQuiz:
      return <GiftQuizPlayer topic={topic as API.TopicQuiz} onComplete={onVideoEnded} onPass={onPass} />;

    default: {
      const unknown = topic as API.Topic;
      return (
        <p className="text-gray-500 italic">
          Content type <code>{(unknown as any).topicable_type}</code> is not yet supported in this viewer.
        </p>
      );
    }
  }
}
