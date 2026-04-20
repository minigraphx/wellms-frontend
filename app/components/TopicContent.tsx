"use client";

import { useContext, useEffect, useState } from "react";
import type { API } from "@escolalms/sdk/lib";
import { TopicType } from "@escolalms/sdk/lib/types/enums";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { SCORMPlayer } from "@escolalms/sdk/lib/react";

interface TopicContentProps {
  topic: API.Topic;
  onVideoEnded?: () => void;
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

export function TopicContent({ topic, onVideoEnded }: TopicContentProps) {
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
      return (
        <video
          src={t.topicable.url}
          poster={t.topicable.poster_url}
          controls
          onEnded={onVideoEnded}
          className="w-full rounded-lg aspect-video bg-black"
        />
      );
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

    default:
      return (
        <p className="text-gray-500 italic">
          Content type <code>{topic.topicable_type}</code> is not yet supported in this viewer.
        </p>
      );
  }
}
