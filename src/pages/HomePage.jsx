import { BookOpen, Mail, ShieldCheck } from "lucide-react";
import { PROGRAMS } from "../data/programs";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import ProgramCard from "../components/ProgramCard";
import SectionCard from "../components/SectionCard";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageContainer className={va.spacing.pageStack}>
      <section className={va.layout.twoColumn}>
        <SectionCard
          title="Learn programming through software and game development."
          description="Expert-led programs built to teach fundamentals to portfolio-ready work, and everything inbetween."
          fullHeight
          minHeight="255px"
        >
          <div style={{ marginTop: "auto" }}>
            <div className={va.layout.flexWrapRow}>
              <button
                onClick={() => navigate("/programs")}
                className={va.buttons.primaryButton}
                style={{
                  backgroundColor: va.colors.primaryColor,
                  ...va.textStyles.bodyText(va.colors.secondaryText),
                }}
              >
                View Programs
              </button>

              <button
                onClick={() => navigate("/contact")}
                className={va.buttons.secondaryButton}
                style={{
                  backgroundColor: va.colors.surfaceColor,
                  borderColor: va.colors.borderColor,
                  ...va.textStyles.bodyText(va.colors.primaryText),
                }}
              >
                Contact
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="About"
          description="Digital Development Institute gives students ages 12 to 18 practical, project-based training in coding, software development, logic, and real-world digital creation, while welcoming any learner age 12 and up who is ready to build."
          fullHeight
          minHeight="255px"
        >
          <div
            className={va.layout.infoList}
            style={{ color: va.colors.primaryTextDark }}
          >
            <div className={va.layout.iconRow}>
              <BookOpen
                className={va.icons.small}
                style={{ color: va.colors.secondaryColor }}
              />
              <span>Small class sizes</span>
            </div>

            <div className={va.layout.iconRow}>
              <ShieldCheck
                className={va.icons.small}
                style={{ color: va.colors.secondaryColor }}
              />
              <span>Structured progression by level</span>
            </div>

            <div className={va.layout.iconRow}>
              <Mail
                className={va.icons.small}
                style={{ color: va.colors.secondaryColor }}
              />
              <span>Remote work style</span>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className={va.spacing.sectionStack}>
        <div className={va.spacing.textStack}>
          <h2
            className={va.text.sectionTitleFont}
            style={{ color: va.colors.primaryText }}
          >
            Programs
          </h2>

          <p
            className={va.text.smallFont}
            style={{ color: va.colors.primaryTextDark }}
          >
            Choose a level to see more details and begin checkout.
          </p>
        </div>

        <div className={va.layout.programGrid}>
          {PROGRAMS.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onView={(id) => navigate(`/programs/${id}`)}
            />
          ))}
        </div>
      </section>

      <SectionCard
        title="Contact"
        description="Contact us for any inquires or issues."
      >
        <div
          className={va.layout.contactList}
          style={{
            ...va.textStyles.baseText(va.colors.primaryTextDark),
          }}
        >
          <div>
            Email:{" "}
            <a
              href="mailto:contact.digitaldevinstitute@gmail.com?subject=Digital%20Development%20Institute%20Inquiry"
              style={{
                color: va.colors.primaryColor,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              contact.digitaldevinstitute@gmail.com
            </a>
          </div>
          <div>Location: Greater Toronto Area</div>
          <div>Delivery: Remote via Google Classroom</div>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
