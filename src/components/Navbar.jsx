import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { visualAid as va } from "../config/visualAid";
import { useAuth } from "../context/AuthContext";
import LogoLogo from "../assets/images/Logo_logo.png";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = user
    ? [
        { key: "/dashboard", label: "Dashboard" },
        { key: "/dashboard/courses", label: "Courses" },
        { key: "/contact", label: "Contact" },
        { key: "/account", label: "Account" },
        ...(profile?.is_admin || profile?.is_instructor
          ? [{ key: "/instructor", label: "Instructor" }]
          : []),
        ...(profile?.is_admin ? [{ key: "/admin", label: "Admin" }] : []),
      ]
    : [
        { key: "/", label: "Home" },
        { key: "/courses", label: "Courses" },
        { key: "/contact", label: "Contact" },
        { key: "/account", label: "Account" },
      ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const renderNavButton = (item, extraClassName = "") => {
    const active =
      item.key === "/"
        ? location.pathname === "/"
        : item.key === "/dashboard"
          ? location.pathname === "/dashboard"
        : location.pathname.startsWith(item.key);

    return (
      <button
        key={item.key}
        onClick={() => handleNavigate(item.key)}
        className={`${
          active ? va.buttons.primaryButton : va.buttons.secondaryButton
        } ${extraClassName}`}
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
  };

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
          className={`${va.layout.iconRow} ${va.misc.textLeft} min-w-0 flex-1 pr-3 md:flex-none md:pr-0`}
          onClick={() => handleNavigate(user ? "/dashboard" : "/")}
          style={{ color: va.colors.primaryText }}
        >
          <div>
            <img
              src={LogoLogo}
              alt="DDI logo"
              style={{
                width: "64px",
                height: "64px",
                objectFit: "contain",
              }}
            />
          </div>

          <div className={`${va.misc.textLeft} min-w-0`}>
            <div className="text-lg font-semibold leading-tight">
              Digital Development Institute
            </div>
            <div
              className="hidden text-xs sm:block"
              style={{ color: va.colors.primaryTextDark }}
            >
              Programming and Development courses
            </div>
          </div>
        </button>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border transition md:hidden"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={
            mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navbar"
          style={{
            color: va.colors.primaryText,
            borderColor: va.colors.secondaryColorDark,
            backgroundColor: va.colors.surfaceColor,
          }}
        >
          {mobileMenuOpen ? (
            <X aria-hidden="true" />
          ) : (
            <Menu aria-hidden="true" />
          )}
        </button>

        <nav className={va.layout.navList}>
          {navItems.map((item) => renderNavButton(item))}
        </nav>
      </div>

      {mobileMenuOpen && (
        <nav
          id="mobile-navbar"
          className={`${va.spacing.centerSpacing} grid gap-2 border-t py-3 md:hidden`}
          style={{ borderColor: va.colors.borderColor }}
        >
          {navItems.map((item) => renderNavButton(item, "w-full"))}
        </nav>
      )}
    </header>
  );
}
