import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";
import { SERVICE_IDS, serviceFromParam } from "../i18n/copy";
import { createLead, isEmail, isPhone } from "../lib/leads";
import type { LeadInput } from "../lib/types";
import { buildLeadWhatsAppMessage, whatsappUrl } from "../lib/whatsapp";
import { getSupabase } from "../lib/supabase";
import { trackBooking } from "../lib/pixel";

const empty: LeadInput = {
  full_name: "",
  business_name: "",
  phone: "",
  email: "",
  city: "",
  business_type: "",
  service: "",
  message: "",
};

export function LeadForm() {
  const { t } = useLang();
  const [params] = useSearchParams();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedService = params.get("service");

  useEffect(() => {
    const fromUrl = serviceFromParam(selectedService);
    if (!fromUrl) return;
    setValues((current) => (current.service === fromUrl ? current : { ...current, service: fromUrl }));
  }, [selectedService]);

  const waLink = useMemo(
    () => whatsappUrl(buildLeadWhatsAppMessage(values, { title: "Pluss.dev" })),
    [values]
  );

  function setField<K extends keyof LeadInput>(key: K, value: LeadInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: false }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (honeypot) return;

    const nextErrors = {
      full_name: !values.full_name.trim(),
      business_name: !values.business_name.trim(),
      phone: !isPhone(values.phone),
      email: !isEmail(values.email),
      service: !values.service.trim(),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      await createLead(values);
      trackBooking();
      setSuccess(true);
      window.open(waLink, "_blank", "noopener");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t.form.fail);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <aside className="form-card is-success" id="signup">
        <div className="form-success">
          <div className="success-icon" aria-hidden="true">
            {"{+}"}
          </div>
          <h3>{t.form.successTitle}</h3>
          <p>
            {t.form.successBody}{" "}
            <a href={waLink} target="_blank" rel="noopener">
              {t.form.successLink}
            </a>
            .
          </p>
        </div>
      </aside>
    );
  }

  const configured = Boolean(getSupabase());

  return (
    <aside className="form-card" id="signup" aria-labelledby="form-title">
      <p className="eyebrow">{t.form.eyebrow}</p>
      <h2 id="form-title">{t.form.title}</h2>
      <p className="form-sub">{t.form.sub}</p>
      <form className="lead-form" onSubmit={onSubmit} noValidate>
        <p className="honeypot">
          <label>
            bot
            <input value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
          </label>
        </p>
        <div className="field-row">
          <label>
            {t.form.name}
            <input
              className={errors.full_name ? "error" : ""}
              value={values.full_name}
              onChange={(e) => setField("full_name", e.target.value)}
              autoComplete="name"
              required
              placeholder={t.form.namePh}
            />
          </label>
          <label>
            {t.form.business}
            <input
              className={errors.business_name ? "error" : ""}
              value={values.business_name}
              onChange={(e) => setField("business_name", e.target.value)}
              autoComplete="organization"
              required
              placeholder={t.form.businessPh}
            />
          </label>
        </div>
        <label>
          {t.form.service}
          <select
            className={errors.service ? "error" : ""}
            value={values.service}
            onChange={(e) => setField("service", e.target.value)}
            required
          >
            <option value="">{t.form.select}</option>
            {SERVICE_IDS.map((id) => (
              <option key={id} value={id}>
                {t.services[id].name}
              </option>
            ))}
            <option value="mix">{t.form.mix}</option>
          </select>
        </label>
        <label>
          {t.form.phone}
          <input
            className={errors.phone ? "error" : ""}
            type="tel"
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            required
            placeholder="05 XX XX XX XX"
            dir="ltr"
          />
        </label>
        <label>
          {t.form.email}
          <input
            className={errors.email ? "error" : ""}
            type="email"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            autoComplete="email"
            required
            placeholder="vous@entreprise.dz"
            dir="ltr"
          />
        </label>
        <div className="field-row">
          <label>
            {t.form.city}
            <input
              value={values.city}
              onChange={(e) => setField("city", e.target.value)}
              autoComplete="address-level2"
              placeholder={t.form.cityPh}
            />
          </label>
          <label>
            {t.form.type}
            <select value={values.business_type} onChange={(e) => setField("business_type", e.target.value)}>
              <option value="">{t.form.select}</option>
              {t.types.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          {t.form.need} <span className="optional">{t.form.optional}</span>
          <textarea
            rows={3}
            value={values.message}
            onChange={(e) => setField("message", e.target.value)}
            placeholder={t.form.needPh}
          />
        </label>
        {submitError ? <p className="form-error">{submitError}</p> : null}
        {!configured ? <p className="form-error">{t.form.missingEnv}</p> : null}
        <button className="btn btn-primary btn-block" type="submit" disabled={submitting || !configured}>
          {submitting ? t.form.saving : t.form.submit}
        </button>
        <p className="form-micro">{t.form.micro}</p>
      </form>
    </aside>
  );
}
