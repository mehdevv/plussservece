import { WHATSAPP_NUMBER, type LeadInput } from "./types";

export function buildLeadWhatsAppMessage(data: LeadInput, labels?: { title: string }) {
  return [
    labels?.title ?? "Nouveau lead Pluss.dev",
    "",
    `Name: ${data.full_name}`,
    `Business: ${data.business_name}`,
    `WhatsApp: ${data.phone}`,
    `Email: ${data.email}`,
    `City: ${data.city || "—"}`,
    `Type: ${data.business_type || "—"}`,
    `Service: ${data.service || "—"}`,
    `Need: ${data.message || "—"}`,
  ].join("\n");
}

export function whatsappUrl(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function directWhatsAppUrl(intro: string) {
  return whatsappUrl(intro);
}

export function leadWhatsAppUrl(phone: string, name: string) {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("213")
    ? digits
    : digits.startsWith("0")
      ? `213${digits.slice(1)}`
      : `213${digits}`;
  return `https://wa.me/${international}?text=${encodeURIComponent(
    `Hi ${name}, this is Mehdi from Pluss.dev — following up on your request.`
  )}`;
}
