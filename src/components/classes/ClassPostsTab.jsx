import { visualAid as va } from "../../config/visualAid";
import SectionCard from "../SectionCard";
import EmbeddedMediaRenderer from "./EmbeddedMediaRenderer";

function formatDate(value) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ClassPostsTab({ posts }) {
  return (
    <SectionCard
      title="Instructor Posts"
      description="Class updates and resources."
    >
      <div className={va.layout.infoList}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <article
              key={post.id}
              className={va.panels.secondaryPanel}
              style={{ borderColor: va.colors.borderColor, padding: "12px" }}
            >
              <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                {post.title}
              </div>
              <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                {formatDate(post.published_at)}
              </div>
              {post.body && (
                <p
                  className={va.spacing.marginTopSmall}
                  style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}
                >
                  {post.body}
                </p>
              )}
              {post.media?.length > 0 && (
                <EmbeddedMediaRenderer media={post.media} />
              )}
            </article>
          ))
        ) : (
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            No instructor posts have been published yet.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
