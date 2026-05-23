import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
  }).format(new Date(value));
}

export default function CertificateVerifyPage() {
  const { certificateCode } = useParams();
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("Verifying certificate...");

  useEffect(() => {
    async function verifyCertificate() {
      try {
        const response = await fetch(
          `/verify-certificate?code=${encodeURIComponent(certificateCode)}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setResult(null);
          setMessage(data.error || "Certificate could not be verified.");
          return;
        }

        setResult(data.certificate);
        setMessage("");
      } catch (error) {
        setResult(null);
        setMessage(error.message || "Certificate could not be verified.");
      }
    }

    verifyCertificate();
  }, [certificateCode]);

  return (
    <PageContainer>
      <SectionCard
        title="Certificate Verification"
        description="Verify a Digital Development Institute certificate."
      >
        {result ? (
          <div className={va.layout.infoList}>
            <div style={va.textStyles.bodyText(va.colors.successColor)}>
              Certificate verified.
            </div>
            <div>Student: {result.studentName}</div>
            <div>Course: {result.courseTitle}</div>
            <div>Certificate: {result.title}</div>
            <div>Issued: {formatDate(result.issuedAt)}</div>
            <div>Code: {result.code}</div>
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              {result.text}
            </div>
            <a
              href={`/download-certificate?code=${encodeURIComponent(result.code)}`}
              style={{
                color: va.colors.primaryColor,
                textDecoration: "underline",
              }}
            >
              Download certificate PDF
            </a>
          </div>
        ) : (
          <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
            {message}
          </div>
        )}
      </SectionCard>
    </PageContainer>
  );
}
