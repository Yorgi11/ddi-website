import { useLocation, useNavigate } from "react-router-dom";
import { visualAid as va } from "../config/visualAid";
import { useAuth } from "../context/AuthContext";
import LogoLogo from "../assets/images/Logo_logo.png";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();

  const navItems = user
    ? [
        { key: "/dashboard", label: "Dashboard" },
        { key: "/programs", label: "Programs" },
        { key: "/contact", label: "Contact" },
        { key: "/account", label: "Account" },
        ...(profile?.is_admin ? [{ key: "/admin", label: "Admin" }] : []),
      ]
    : [
        { key: "/", label: "Home" },
        { key: "/programs", label: "Programs" },
        { key: "/contact", label: "Contact" },
        { key: "/account", label: "Account" },
      ];

  return (
    <header
      className={va.layout.navbarShell}
      style={{
        backgroundColor: va.colors.surfaceColor,
        borderColor: va.colors.borderColor,
      }}
    >
      <div className={`${va.spacing.centerSpacing} ${va.layout.navbarInner}`}>
        <button
          className={`${va.layout.iconRow} ${va.misc.textLeft}`}
          onClick={() => navigate(user ? "/dashboard" : "/")}
          style={{ color: va.colors.primaryText }}
        >
          <div
            className={va.icons.logoBox}
            style={{
              backgroundColor: va.colors.primaryColor,
            }}
          >
            <img
              src={LogoLogo}
              alt="Digital Development Institute logo"
              style={{
                width: "24px",
                height: "24px",
                objectFit: "contain",
              }}
            />
          </div>

          <div className={va.misc.textLeft}>
            <div className="text-lg font-semibold">
              Digital Development Institute
            </div>
            <div
              className="text-xs"
              style={{ color: va.colors.primaryTextDark }}
            >
              Programming and Development programs
            </div>
          </div>
        </button>

        <nav className={va.layout.navList}>
          {navItems.map((item) => {
            const active =
              item.key === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.key);

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={
                  active ? va.buttons.primaryButton : va.buttons.secondaryButton
                }
                style={{
                  backgroundColor: active
                    ? va.colors.primaryColor
                    : va.colors.surfaceColor,
                  color: va.colors.primaryText,
                  borderColor: active
                    ? va.colors.primaryColor
                    : va.colors.secondaryColorDark,
                  ...va.textStyles.navButtonText(
                    active ? va.colors.secondaryText : va.colors.primaryText,
                  ),
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
