import { useEffect, useState } from "react";
import { visualAid as va } from "../../config/visualAid";
import { supabase } from "../../lib/supabase";

function getYouTubeEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    const videoId =
      parsed.hostname.includes("youtu.be")
        ? parsed.pathname.slice(1)
        : parsed.searchParams.get("v");

    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } catch {
    return url;
  }
}

export default function EmbeddedMediaRenderer({ media }) {
  const [signedUrls, setSignedUrls] = useState({});

  useEffect(() => {
    async function loadSignedUrls() {
      const storedMedia = (media ?? []).filter((item) => item.storage_path);

      if (storedMedia.length === 0) {
        setSignedUrls({});
        return;
      }

      const nextUrls = {};

      for (const item of storedMedia) {
        const { data } = await supabase.storage
          .from("class-post-media")
          .createSignedUrl(item.storage_path, 300);

        if (data?.signedUrl) {
          nextUrls[item.storage_path] = data.signedUrl;
        }
      }

      setSignedUrls(nextUrls);
    }

    loadSignedUrls();
  }, [media]);

  if (!media?.length) return null;

  return (
    <div className={`${va.spacing.marginTopMedium} ${va.layout.infoList}`}>
      {media.map((item) => {
        const key = item.id ?? `${item.type}-${item.url ?? item.storage_path}`;
        const url = item.url ?? signedUrls[item.storage_path];

        if (!url) return null;

        if (item.type === "image") {
          return (
            <img
              key={key}
              src={url}
              alt={item.title ?? "Class media"}
              className="max-h-80 w-full rounded-lg object-cover"
            />
          );
        }

        if (item.type === "youtube") {
          return (
            <div key={key} className="aspect-video overflow-hidden rounded-lg">
              <iframe
                title={item.title ?? "YouTube video"}
                src={getYouTubeEmbedUrl(url)}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }

        if (item.type === "mp4") {
          return (
            <video key={key} controls className="w-full rounded-lg">
              <source src={url} type="video/mp4" />
            </video>
          );
        }

        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noreferrer"
            className={va.panels.secondaryPanel}
            style={{
              borderColor: va.colors.borderColor,
              color: va.colors.primaryColor,
              padding: "12px",
              textDecoration: "underline",
            }}
          >
            {item.title || (item.type === "file" ? "Open file" : "Open link")}
          </a>
        );
      })}
    </div>
  );
}
