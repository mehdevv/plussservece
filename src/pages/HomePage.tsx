import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { LeadForm } from "../components/LeadForm";
import { Navbar } from "../components/Navbar";
import { ServiceVisual } from "../components/ServiceVisual";
import { useLang } from "../i18n/LanguageContext";
import { SERVICES, type ServiceId } from "../i18n/copy";
import { LINKEDIN_URL, PORTFOLIO_URL } from "../lib/types";
import { trackBooking } from "../lib/pixel";
import { directWhatsAppUrl } from "../lib/whatsapp";

const stepIcons = ["phone", "build", "launch"] as const;

export function HomePage() {
  const { t } = useLang();
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const card = document.getElementById("signup");
    function update() {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const pastForm = rect.bottom < 80;
      const nearFooter = window.innerHeight + window.scrollY > document.body.scrollHeight - 280;
      setShowSticky(window.innerWidth <= 900 && pastForm && !nearFooter);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#signup">
        {t.skip}
      </a>
      <Navbar />
      <main id="top">
        <section className="section plans" id="services">
          <div className="container">
            <p className="eyebrow">Pluss.dev</p>
            <h1>{t.hero.title}</h1>
            <div className="service-grid">
              {SERVICES.map((service) => {
                const item = t.services[service.id as ServiceId];
                return (
                  <article className={`service-card is-${service.id}`} id={service.id} key={service.id}>
                    <div className="service-card-top">
                      <div className="service-word">{service.short}</div>
                      <span className="plan-tag">{item.tag}</span>
                    </div>
                    <ServiceVisual id={service.id} />
                    <h3>{item.name}</h3>
                    <ul>
                      {item.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                    <div className="service-card-bottom">
                      <div className="plan-price">
                        <strong>{item.price}</strong>
                        <span>{item.timing}</span>
                      </div>
                      <Link className="btn btn-plan" to={`/?service=${service.id}#signup`} onClick={trackBooking}>
                        {t.offers.choose}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section form-section">
          <div className="container form-wrap">
            <LeadForm />
          </div>
        </section>

        <section className="section" id="faq">
          <div className="container">
            <header className="section-head">
              <p className="eyebrow">{t.faq.mark}</p>
              <h2>{t.faq.title}</h2>
            </header>
            <div className="faq-list">
              {t.faq.items.map((item, index) => (
                <details key={item.q} open={index === 0}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="process">
          <div className="container">
            <header className="section-head">
              <p className="eyebrow">{t.process.mark}</p>
              <h2>{t.process.title}</h2>
            </header>
            <ol className="steps">
              {t.process.steps.map((step, index) => (
                <li key={step.title}>
                  <div className={`step-icon is-${stepIcons[index]}`} aria-hidden="true">
                    {stepIcons[index] === "phone" ? <i /> : null}
                    {stepIcons[index] === "build" ? (
                      <>
                        <span />
                        <span />
                        <span />
                        <span />
                      </>
                    ) : null}
                    {stepIcons[index] === "launch" ? <b /> : null}
                  </div>
                  <span className="step-num">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section" id="about">
          <div className="container split">
            <div className="about-photo">
              <img src="/4.webp" alt="Mehdi Kernou" width={640} height={640} />
            </div>
            <div className="section-body">
              <p className="eyebrow">{t.about.mark}</p>
              <h2>{t.about.title}</h2>
              <p>{t.about.bio}</p>
              <ul className="creds">
                {t.about.creds.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <a className="text-link" href={LINKEDIN_URL} target="_blank" rel="noopener">
                {t.about.linkedin}
              </a>
            </div>
          </div>
        </section>

        <section className="section" id="work">
          <div className="container">
            <header className="section-head">
              <p className="eyebrow">{t.work.mark}</p>
              <h2>{t.work.title}</h2>
            </header>
            <div className="work-list">
              {t.work.items.map((item) => (
                <article key={item.name}>
                  <em>{item.kind}</em>
                  <h3>{item.name}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
            <a className="btn btn-primary work-cta" href={PORTFOLIO_URL} target="_blank" rel="noopener">
              {t.work.cta}
            </a>
          </div>
        </section>

        <section className="section final-cta">
          <div className="container">
            <header className="section-head">
              <h2>{t.start.title}</h2>
            </header>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#signup" onClick={trackBooking}>
                {t.start.book}
              </a>
              <a className="btn btn-ghost" href={directWhatsAppUrl(t.waIntro)} target="_blank" rel="noopener">
                {t.start.whatsapp}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      {showSticky ? (
        <div className="sticky-bar">
          <span>{t.sticky.label}</span>
          <a className="btn btn-primary" href="#signup" onClick={trackBooking}>
            {t.sticky.book}
          </a>
        </div>
      ) : null}
    </>
  );
}
