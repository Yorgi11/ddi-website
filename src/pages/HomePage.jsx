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
          title="Learn programming, software, and game development."
          description="Structured programs for students from Grade 8 to 12, with a clear path from fundamentals to advanced portfolio work."
        >
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
        </SectionCard>

        <SectionCard
          title="About"
          description="Digital Development Institute provides high-school students with practical training in coding, software development, logic, and project building."
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
              <span>Remote and in-person delivery options</span>
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
            Choose a level to see details and begin checkout.
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
        description="General contact information placeholder."
      >
        <div
          className={va.layout.contactList}
          style={{
            ...va.textStyles.baseText(va.colors.primaryTextDark),
          }}
        >
          <div>Email: info@digitaldevelopmentinstitute.com</div>
          <div>Location: Greater Toronto Area</div>
          <div>Delivery: Remote and in-person</div>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
