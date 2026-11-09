// Tipos de lead que chegam pelo site (João): a mensagem montada pelo site diz o que o cliente quer.
// Mantém as mesmas regras do site (place-frontend/src/lib/vendaImovel.js e prontosEUsados.js).

const VENDER = "Interesse em: Quero vender meu imóvel";
const PRONTO_OU_USADO = "Interesse em: Imóvel pronto ou usado";

/** "captacao" (quer vender o imóvel), "pronto_usado" (procura pronto ou usado) ou null. */
export function tipoDoLead(mensagem = "") {
  const m = String(mensagem ?? "");
  if (m.startsWith(VENDER)) return "captacao";
  if (m.startsWith(PRONTO_OU_USADO)) return "pronto_usado";
  return null;
}

/** A linha com o que o cliente contou: o imóvel que quer vender ou o que procura. */
export function detalheDoPedido(mensagem = "") {
  const linhas = String(mensagem ?? "").split("\n");
  const linha = linhas.find((l) => l.startsWith("Imóvel para vender: ") || l.startsWith("Procura: "));
  return linha ? linha.replace(/^(Imóvel para vender|Procura): /, "") : "";
}

/** Primeira mensagem do WhatsApp, de acordo com o tipo do lead. */
export function assuntoDoContato(lead) {
  const tipo = tipoDoLead(lead?.mensagem);
  if (tipo === "captacao") return "sobre o imóvel que você quer vender";
  if (tipo === "pronto_usado") return "sobre o imóvel pronto ou usado que você procura";
  return `sobre o seu interesse${lead?.empreendimento?.nome ? ` no ${lead.empreendimento.nome}` : ""}`;
}
