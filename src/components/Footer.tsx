import { Link } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";
import { CONTACT_EMAIL, LINKEDIN_URL, SITE_URL } from "../lib/types";
import { directWhatsAppUrl } from "../lib/whatsapp";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <a className="brand" href={SITE_URL}>
            <img src="/logo.png" alt="" width={36} height={36} className="brand-logo" />
            <span className="brand-word">
              Pluss<span>.dev</span>
            </span>
          </a>
          <p>{t.footer.blurb}</p>
        </div>
        <nav aria-label={t.footer.contact}>
          <a href="#services">{t.nav.services}</a>
          <a href="#process">{t.nav.process}</a>
          <a href="#about">{t.nav.about}</a>
          <a href="#work">{t.nav.work}</a>
          <a href="#signup">{t.footer.contact}</a>
        </nav>
        <div className="footer-contact">
          <a href={directWhatsAppUrl(t.waIntro)} target="_blank" rel="noopener">
            WhatsApp
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`}>Email</a>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener">
            LinkedIn
          </a>
          <Link to="/admin">{t.footer.inbox}</Link>
        </div>
      </div>
      <p className="copyright container">© 2026 Pluss.dev. {t.footer.rights}</p>
    </footer>
  );
}
