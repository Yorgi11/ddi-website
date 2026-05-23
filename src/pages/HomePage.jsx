import {
  Code2,
  CreditCard,
  Gamepad2,
  GraduationCap,
  Mail,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
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
          title="Programming and game development courses for serious learners."
          description="Students create an account, choose a course, enroll in an open class section, and move through a structured path from coding fundamentals to portfolio-ready work."
          fullHeight
          minHeight="300px"
          headerSpacing={va.spacing.marginBottomLarge}
        >
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
            }}
          >
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              DDI combines practical instruction, progression rules, and a
              student dashboard so enrollment, payment, and course access stay in
              one place.
            </div>
            <div
              className={va.layout.flexWrapRow}
              style={{ marginTop: "auto", paddingTop: "16px" }}
            >
              <button
                onClick={() => navigate("/courses")}
                className={va.buttons.primaryButton}
                style={{
                  backgroundColor: va.colors.primaryColor,
                  ...va.textStyles.bodyText(va.colors.secondaryText),
                }}
              >
                View Courses
              </button>

              <button
                onClick={() => navigate("/account")}
                className={va.buttons.secondaryButton}
                style={{
                  backgroundColor: va.colors.surfaceColor,
                  borderColor: va.colors.borderColor,
                  ...va.textStyles.bodyText(va.colors.primaryText),
                }}
              >
                Create Account
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="About Digital Development Institute"
          description="Digital Development Institute gives students practical, project-based training in coding, software development, logic, and real-world digital creation."
          fullHeight
          minHeight="300px"
        >
          <div
            className={va.layout.infoList}
            style={{ color: va.colors.primaryTextDark }}
          >
            <div className={va.layout.iconRow}>
              <GraduationCap
                className={va.icons.small}
                style={{ color: va.colors.secondaryColor }}
              />
              <span>Structured levels for ages 12 and up</span>
            </div>

            <div className={va.layout.iconRow}>
              <ShieldCheck
                className={va.icons.small}
                style={{ color: va.colors.secondaryColor }}
              />
              <span>Structured progression by level</span>
            </div>

            <div className={va.layout.iconRow}>
              <Gamepad2
                className={va.icons.small}
                style={{ color: va.colors.secondaryColor }}
              />
              <span>Software and game development projects</span>
            </div>

            <div className={va.layout.iconRow}>
              <Mail
                className={va.icons.small}
                style={{ color: va.colors.secondaryColor }}
              />
              <span>Remote and in-person delivery through the DDI Student Dashboard</span>
            </div>
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Enrollment Flow"
        description="The site is built as a student portal, not just a brochure."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Code2,
              title: "Choose a course",
              copy: "Review open sections, outcomes, timing, and pricing before checkout.",
            },
            {
              icon: WalletCards,
              title: "Pay online",
              copy: "Use e-Transfer, credit or debit card through Stripe, or PayPal.",
            },
            {
              icon: ShieldCheck,
              title: "Track access",
              copy: "The dashboard keeps course access and payment status connected.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={`${va.panels.secondaryPanel} ${va.spacing.cardSpacing}`}
                style={{
                  backgroundColor: va.colors.pageColor,
                  borderColor: va.colors.borderColor,
                }}
              >
                <Icon
                  className={va.icons.medium}
                  style={{ color: va.colors.secondaryColor }}
                />
                <div
                  className={`${va.spacing.marginTopMedium} ${va.text.strongText}`}
                  style={{ color: va.colors.primaryText }}
                >
                  {item.title}
                </div>
                <div
                  className={`${va.spacing.marginTopSmall} ${va.text.smallFont}`}
                  style={{ color: va.colors.primaryTextDark }}
                >
                  {item.copy}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Courses"
        description="Browse DDI course tracks, open class sections, and LMS-managed learning paths."
      >
        <PrimaryCoursesLink onClick={() => navigate("/courses")} />
      </SectionCard>

      <SectionCard
        title="Payments"
        description="DDI supports manual and online payment paths during checkout."
      >
        <div className={va.layout.infoList}>
          <div className={va.layout.iconRow}>
            <CreditCard
              className={va.icons.small}
              style={{ color: va.colors.secondaryColor }}
            />
            <span>Credit and debit card payments are handled by Stripe.</span>
          </div>
          <div className={va.layout.iconRow}>
            <WalletCards
              className={va.icons.small}
              style={{ color: va.colors.secondaryColor }}
            />
            <span>PayPal and e-Transfer are available as separate choices.</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Contact"
        description="Contact us for any inquiries or payment support."
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
          <div>
            Delivery: Remote and in-person through the DDI Student Dashboard
          </div>
        </div>
      </SectionCard>
    </PageContainer>
  );
}

function PrimaryCoursesLink({ onClick }) {
  return (
    <button
      onClick={onClick}
      className={va.buttons.primaryButton}
      style={{
        backgroundColor: va.colors.primaryColor,
        ...va.textStyles.bodyText(va.colors.secondaryText),
      }}
    >
      Browse Courses
    </button>
  );
}
