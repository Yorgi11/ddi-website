import { useEffect, useState } from "react";
import { visualAid as va } from "../config/visualAid";
import { supabase } from "../lib/supabase";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import TextInput from "../components/TextInput";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function AccountPage() {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [payments, setPayments] = useState([]);
  const [programStatuses, setProgramStatuses] = useState([]);

  const { user, profile } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/account";

  useEffect(() => {
    async function loadPayments() {
      if (!user) {
        setPayments([]);
        return;
      }

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setPayments(data ?? []);
      }

      const { data: statusData, error: statusError } = await supabase
        .from("program_status")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!statusError) {
        setProgramStatuses(statusData ?? []);
      }
    }

    loadPayments();
  }, [user]);

  async function handleRegister() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Account created. Check your email if confirmation is enabled.");
    setLoading(false);
  }

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Logged in successfully.");
    setLoading(false);
    navigate(redirectTo, { replace: true });
  }

  return (
    <PageContainer>
      <div className={va.layout.accountGrid}>
        <SectionCard
          title="Account"
          description="Simple login and registration layout."
        >
          <div className={va.spacing.sectionStack}>
            <div className={va.layout.toggleGridTwo}>
              {mode === "login" ? (
                <PrimaryButton onClick={() => setMode("login")}>
                  Login
                </PrimaryButton>
              ) : (
                <SecondaryButton onClick={() => setMode("login")}>
                  Login
                </SecondaryButton>
              )}

              {mode === "register" ? (
                <PrimaryButton onClick={() => setMode("register")}>
                  Register
                </PrimaryButton>
              ) : (
                <SecondaryButton onClick={() => setMode("register")}>
                  Register
                </SecondaryButton>
              )}
            </div>

            {mode === "login" ? (
              <div className={va.spacing.sectionStack}>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <PrimaryButton
                  fullWidth
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </PrimaryButton>
              </div>
            ) : (
              <div className={va.spacing.sectionStack}>
                <TextInput
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <PrimaryButton
                  fullWidth
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create account"}
                </PrimaryButton>
              </div>
            )}

            {message && (
              <div
                style={{
                  ...va.textStyles.bodyTextThin(va.colors.primaryTextDark),
                }}
              >
                {message}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="User profile preview"
          description="Target data structure for simple accounts."
        >
          <div
            className={va.layout.infoList}
            style={{ color: va.colors.primaryTextDark }}
          >
            {user ? (
              <>
                <div>Username: {profile?.username ?? "..."}</div>
                <div>Email: {user.email}</div>
                <div>Level: {profile?.current_level ?? 1}</div>
                <div>
                  Levels paid for:{" "}
                  {profile?.levels_paid_for?.join(", ") || "None"}
                </div>
                <div>
                  Completed levels:{" "}
                  {profile?.completed_levels?.join(", ") || "None"}
                </div>
                <div>
                  Placement access:{" "}
                  {profile?.placement_access?.join(", ") || "None"}
                </div>
                <PrimaryButton fullWidth onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </PrimaryButton>
                <SecondaryButton
                  fullWidth
                  onClick={async () => {
                    await supabase.auth.signOut();
                  }}
                >
                  Logout
                </SecondaryButton>
              </>
            ) : (
              <div>Not logged in</div>
            )}
          </div>
        </SectionCard>
        <SectionCard
          title="Payment History"
          description="Your recent payment records."
        >
          <div
            className={va.layout.infoList}
            style={{ color: va.colors.primaryTextDark }}
          >
            {user ? (
              payments.length > 0 ? (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className={va.panels.secondaryPanel}
                    style={{
                      backgroundColor: va.colors.surfaceColor,
                      borderColor: va.colors.borderColor,
                      padding: "12px",
                    }}
                  >
                    <div>Program: {payment.program_id}</div>
                    <div>Total: ${Number(payment.total).toFixed(2)}</div>
                    <div>Method: {payment.payment_method}</div>
                    <div>Status: {payment.status}</div>
                    <div>Reference: {payment.reference_code || "N/A"}</div>
                  </div>
                ))
              ) : (
                <div>No payments yet.</div>
              )
            ) : (
              <div>Log in to view payment history.</div>
            )}
          </div>
        </SectionCard>
        <SectionCard
          title="Program Status"
          description="Your current status for each program."
        >
          <div
            className={va.layout.infoList}
            style={{ color: va.colors.primaryTextDark }}
          >
            {user ? (
              programStatuses.length > 0 ? (
                programStatuses.map((item) => (
                  <div
                    key={item.id}
                    className={va.panels.secondaryPanel}
                    style={{
                      backgroundColor: va.colors.surfaceColor,
                      borderColor: va.colors.borderColor,
                      padding: "12px",
                    }}
                  >
                    <div>Program: {item.program_id}</div>
                    <div>Status: {item.status}</div>
                  </div>
                ))
              ) : (
                <div>No program status records yet.</div>
              )
            ) : (
              <div>Log in to view program status.</div>
            )}
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
