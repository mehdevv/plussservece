import { useState } from "react";
import { SITE_URL } from "../lib/types";
import { trackBooking } from "../lib/pixel";
import { useLang } from "../i18n/LanguageContext";

export function Navbar() {
  const { t, locale, setLocale } = useLang();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#services", label: t.nav.services },
    { href: "#process", label: t.nav.process },
    { href: "#about", label: t.nav.about },
    { href: "#work", label: t.nav.work },
  ];

  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href={SITE_URL} aria-label="pluss.dev">
          <img src="/logo.png" alt="" width={40} height={40} className="brand-logo" />
          <span className="brand-word">
            Pluss<span>.dev</span>
          </span>
        </a>
        <nav className="nav-links" aria-label={locale === "ar" ? "التنقل" : "Navigation"}>
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="lang-switch" role="group" aria-label={locale === "ar" ? "اللغة" : "Langue"}>
          <button type="button" className={locale === "fr" ? "is-active" : ""} onClick={() => setLocale("fr")}>
            FR
          </button>
          <button type="button" className={locale === "ar" ? "is-active" : ""} onClick={() => setLocale("ar")}>
            ع
          </button>
        </div>
        <a className="btn btn-primary nav-cta" href="#signup" onClick={trackBooking}>
          {t.nav.book}
        </a>
        <button
          className="nav-toggle"
          type="button"
          aria-label={t.nav.menu}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </div>
      <div className={`mobile-menu${open ? " open" : ""}`} hidden={!open}>
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
        <a
          className="btn btn-primary"
          href="#signup"
          onClick={() => {
            trackBooking();
            setOpen(false);
          }}
        >
          {t.nav.book}
        </a>
      </div>
    </header>
  );
}
