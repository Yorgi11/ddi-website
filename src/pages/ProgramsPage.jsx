import { useNavigate } from "react-router-dom";
import { PROGRAMS } from "../data/programs";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import ProgramCard from "../components/ProgramCard";

export default function ProgramsPage() {
  const navigate = useNavigate();

  return (
    <PageContainer className={va.spacing.sectionStack}>
      <div className={va.spacing.textStack}>
        <h1
          className={va.text.pageTitleFont}
          style={{ color: va.colors.primaryText }}
        >
          Programs
        </h1>
        <p
          className={va.text.smallFont}
          style={{ color: va.colors.primaryTextDark }}
        >
          Program list with pricing, breakdown, and progression rules.
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
    </PageContainer>
  );
}
