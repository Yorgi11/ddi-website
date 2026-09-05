import { Suspense } from "react";
import { Github } from "lucide-react";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import { visualAid as va } from "../config/visualAid";
import { SHOWCASE_PROJECTS } from "../data/showcaseProjects";

export default function ShowcasePage() {
  return (
    <PageContainer>
      <div className={va.spacing.pageStack}>
        <SectionCard
          title="Showcase"
          description="Student and institute projects built through DDI courses."
        >
          <div className={va.layout.infoList}>
            {SHOWCASE_PROJECTS.map((project) => {
              const ProjectView = project.ViewComponent;

              return (
                <article
                  key={project.id}
                  className={va.panels.secondaryPanel}
                  style={{
                    borderColor: va.colors.borderColor,
                    backgroundColor: va.colors.surfaceColor,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      borderBottom: `1px solid ${va.colors.borderColor}`,
                      backgroundColor: "#020617",
                      display: "grid",
                      placeItems: "center",
                      padding: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "min(100%, 800px)",
                      }}
                    >
                      <Suspense
                        fallback={
                          <div
                            style={{
                              aspectRatio: "1 / 1",
                              display: "grid",
                              placeItems: "center",
                              color: va.colors.secondaryText,
                            }}
                          >
                            Loading project...
                          </div>
                        }
                      >
                        <ProjectView />
                      </Suspense>
                    </div>
                  </div>

                  <div className={va.spacing.cardSpacing}>
                    <div className={va.spacing.sectionStack}>
                      <div>
                        <h1
                          className={va.text.cardTitleFont}
                          style={{ color: va.colors.primaryText }}
                        >
                          {project.title}
                        </h1>
                        <p
                          className={va.spacing.marginTopSmall}
                          style={va.textStyles.bodyTextThin(
                            va.colors.primaryTextDark,
                          )}
                        >
                          {project.description}
                        </p>
                      </div>

                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={va.buttons.secondaryButton}
                          style={{
                            borderColor: va.colors.borderColor,
                            color: va.colors.primaryText,
                            width: "fit-content",
                          }}
                        >
                          <Github className={va.icons.small} aria-hidden="true" />
                          View GitHub
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
