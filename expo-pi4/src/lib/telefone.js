const digitos = (v = "") => String(v).replace(/\D/g, "");

/** (81) 99999-8888 */
export function formatarTelefone(v) {
  let d = digitos(v);
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v ?? "";
}

/** Número com DDI 55 para ligação e WhatsApp. */
export function comDdi(v) {
  const d = digitos(v);
  if (!d) return "";
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
}

export const linkLigar = (v) => `tel:+${comDdi(v)}`;

/** Começa com "bom dia/boa tarde/boa noite", como a Place ensina. */
export function saudacao(agora = new Date()) {
  const h = agora.getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export function linkWhatsApp(telefone, texto = "") {
  const n = comDdi(telefone);
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}