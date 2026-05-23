import { visualAid as va } from "../../config/visualAid";
import SectionCard from "../SectionCard";

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function AchievementsCard({ badges, certificates }) {
  return (
    <SectionCard
      title="Achievements"
      description="Badges and certificates earned through DDI courses."
    >
      <div className={va.spacing.sectionStack}>
        <div>
          <div
            className={va.spacing.marginBottomSmall}
            style={va.textStyles.bodyText(va.colors.primaryText)}
          >
            Badges
          </div>
          <div className={va.layout.infoList}>
            {badges.length > 0 ? (
              badges.slice(0, 4).map((studentBadge) => (
                <div
                  key={studentBadge.id}
                  className={va.panels.secondaryPanel}
                  style={{ borderColor: va.colors.borderColor, padding: "12px" }}
                >
                  <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                    {studentBadge.badge?.title ?? "Badge"}
                  </div>
                  <div
                    style={va.textStyles.bodyTextThin(
                      va.colors.primaryTextDark,
                    )}
                  >
                    {studentBadge.badge?.description ?? "DDI achievement"}
                  </div>
                  <div
                    style={va.textStyles.bodyTextThin(
                      va.colors.primaryTextDark,
                    )}
                  >
                    Awarded: {formatDate(studentBadge.awarded_at)} /{" "}
                    {studentBadge.display_status}
                  </div>
                </div>
              ))
            ) : (
              <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                No badges earned yet.
              </div>
            )}
          </div>
        </div>

        <div>
          <div
            className={va.spacing.marginBottomSmall}
            style={va.textStyles.bodyText(va.colors.primaryText)}
          >
            Certificates
          </div>
          <div className={va.layout.infoList}>
            {certificates.length > 0 ? (
              certificates.slice(0, 3).map((certificate) => (
                <div
                  key={certificate.id}
                  className={va.panels.secondaryPanel}
                  style={{ borderColor: va.colors.borderColor, padding: "12px" }}
                >
                  <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                    {certificate.certificate_title}
                  </div>
                  <div
                    style={va.textStyles.bodyTextThin(
                      va.colors.primaryTextDark,
                    )}
                  >
                    Issued: {formatDate(certificate.issued_at)}
                  </div>
                  <a
                    href={`/certificates/verify/${certificate.certificate_code}`}
                    style={{
                      color: va.colors.primaryColor,
                      textDecoration: "underline",
                    }}
                  >
                    Verify certificate
                  </a>
                  <br />
                  <a
                    href={`/download-certificate?code=${encodeURIComponent(
                      certificate.certificate_code,
                    )}`}
                    style={{
                      color: va.colors.primaryColor,
                      textDecoration: "underline",
                    }}
                  >
                    Download PDF
                  </a>
                </div>
              ))
            ) : (
              <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                No certificates issued yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
