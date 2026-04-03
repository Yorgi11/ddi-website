import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";

export default function ContactPage() {
  return (
    <PageContainer>
      <SectionCard
        title="Contact"
        description="Replace placeholders with your real business contact details."
      >
        <div
          className={va.layout.contactList}
          style={{
            ...va.textStyles.bodyText(va.colors.primaryTextDark),
          }}
        >
          <div>Email: info@digitaldevelopmentinstitute.com</div>
          <div>Phone: (000) 000-0000</div>
          <div>Service Area: Greater Toronto Area</div>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
