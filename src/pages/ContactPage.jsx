import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";

export default function ContactPage() {
  return (
    <PageContainer>
      <SectionCard
        title="Contact"
        description="Contact us for any inquires or issues."
      >
        <div
          className={va.layout.contactList}
          style={{
            ...va.textStyles.bodyText(va.colors.primaryTextDark),
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
