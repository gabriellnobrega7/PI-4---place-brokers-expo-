// Regras de preço e prazo da Place (iguais ao site, src/lib/precoCatalogo.js do front).
export const SEGMENTOS = {
  mcmv: "Minha Casa Minha Vida",
  medio_padrao: "Médio padrão",
  alto_padrao: "Alto padrão",
  litoral: "Litoral",
};

export const FASES = { lancamento: "Lançamento", obras: "Em obras", pronto: "Pronto", outros: "Outros" };

const numero = (v) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
export const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Prontos e usados: a entrada é à vista, então mostram o preço cheio, mesmo no MCMV. */
export const ETAPAS_PRECO_CHEIO = ["pronto", "usado"];
export const mostraPrecoCheio = (emp = {}) => ETAPAS_PRECO_CHEIO.includes(String(emp.status ?? "").toLowerCase());

export function precoDoEmpreendimento(emp = {}) {
  const parcela = numero(emp.parcela_min);
  const total = numero(emp.preco_min);
  if (emp.segmento === "mcmv" && parcela != null && !mostraPrecoCheio(emp)) {
    return { rotulo: "Parcelas a partir de", valor: brl(parcela), sufixo: "/mês", temValor: true };
  }
  if (total != null) return { rotulo: "A partir de", valor: brl(total), sufixo: "", temValor: true };
  // Pronto/usado sem preço cheio cadastrado: melhor a parcela do que "sob consulta".
  if (emp.segmento === "mcmv" && parcela != null) return { rotulo: "Parcelas a partir de", valor: brl(parcela), sufixo: "/mês", temValor: true };
  return { rotulo: "Valores", valor: "Sob consulta", sufixo: "", temValor: false };
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export function prazoDoEmpreendimento(emp = {}) {
  if (emp.status === "pronto") return "Pronto para morar";
  if (!emp.previsao_entrega) return null;
  const [ano, mes] = String(emp.previsao_entrega).slice(0, 7).split("-").map(Number);
  if (!ano || !mes) return null;
  return `Entrega prevista: ${MESES[mes - 1]}/${ano}`;
}

export function faixa(min, max, singular, plural) {
  const a = numero(min);
  const b = numero(max);
  if (a == null && b == null) return "";
  if (a == null) return `Até ${b} ${b === 1 ? singular : plural}`;
  if (b == null || a === b) return `${a} ${a === 1 ? singular : plural}`;
  return `${a} a ${b} ${plural}`;
}

/** Mensagem para o cliente: apresenta e chama para conversar, sem mandar book nem tabela. */
export function mensagemDoEmpreendimento(emp, link) {
  const local = [emp.bairro && emp.bairro !== "A confirmar" ? emp.bairro : null, emp.cidade].filter(Boolean).join(", ");
  const preco = precoDoEmpreendimento(emp);
  const prazo = prazoDoEmpreendimento(emp);
  return [
    "Olá! Tudo bem?",
    `Separei este empreendimento para você: *${emp.nome}*${local ? ` — ${local}` : ""}.`,
    preco.temValor ? `${preco.rotulo} ${preco.valor}${preco.sufixo}.` : null,
    prazo ? `${prazo}.` : null,
    "",
    `Fotos e localização: ${link}`,
    "",
    "Quando for um bom horário para conversarmos?",
  ].filter((l) => l !== null).join("\n");
}