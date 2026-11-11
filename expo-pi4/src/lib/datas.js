const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const dois = (n) => String(n).padStart(2, "0");
const STATUS_FINAIS = new Set(["realizado", "nao_compareceu", "cancelado"]);
const comoData = (v) => v instanceof Date ? new Date(v.getTime()) : new Date(v);
export const dataValida = (v) => Number.isFinite(comoData(v).getTime());
export const chaveDia = (v) => { const d = comoData(v); return dataValida(d) ? [d.getFullYear(), dois(d.getMonth() + 1), dois(d.getDate())].join("-") : ""; };
export const statusEncerrado = (status) => STATUS_FINAIS.has(status);
export const dataFutura = (v, agora = new Date()) => dataValida(v) && dataValida(agora) && comoData(v) > comoData(agora);
export const podeFinalizar = (v, agora = new Date()) => dataValida(v) && dataValida(agora) && comoData(v) <= comoData(agora);
export function combinarDataHora(atual, escolhido, modo) {
  const d = comoData(atual), v = comoData(escolhido);
  if (!dataValida(d) || !dataValida(v)) return d;
  if (modo === "date") d.setFullYear(v.getFullYear(), v.getMonth(), v.getDate());
  if (modo === "time") d.setHours(v.getHours(), v.getMinutes(), 0, 0);
  return d;
}


export const hora = (d) => dataValida(d) ? `${dois(comoData(d).getHours())}:${dois(comoData(d).getMinutes())}` : "—";

/** "Hoje", "Amanhã", "Ontem" ou "qua, 05/11". */
export function dia(d, agora = new Date()) {
  const a = new Date(d);
  if (!dataValida(a) || !dataValida(agora)) return "Data inválida";
  const civil = (x) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  const dif = Math.round((civil(a) - civil(agora)) / 86400000);
  if (dif === 0) return "Hoje";
  if (dif === 1) return "Amanhã";
  if (dif === -1) return "Ontem";
  return `${DIAS[a.getDay()]}, ${dois(a.getDate())}/${dois(a.getMonth() + 1)}`;
}

/** "agora", "há 5 min", "há 2 h", "há 3 dias". */
export function tempoDesde(d, agora = new Date()) {
  if (!dataValida(d) || !dataValida(agora)) return "—";
  const min = Math.max(0, Math.floor((agora - new Date(d)) / 60000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.floor(h / 24);
  return `há ${dias} dia${dias > 1 ? "s" : ""}`;
}

/** Separa agendamentos por dia e situação, sem alterar a lista de origem. */
export function separarAgenda(lista = [], agora = new Date()) {
  const hoje = chaveDia(agora);
  const inicioDeHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const ordena = (a, b) => new Date(a.dataHora) - new Date(b.dataHora);
  const pendentes = (lista ?? []).filter((a) => !statusEncerrado(a.status));
  return {
    hoje: pendentes.filter((a) => chaveDia(a.dataHora) === hoje).sort(ordena),
    proximos: pendentes.filter((a) => dataValida(a.dataHora) && chaveDia(a.dataHora) > hoje).sort(ordena),
    historico: (lista ?? []).filter((a) => statusEncerrado(a.status) || !dataValida(a.dataHora) || new Date(a.dataHora) < inicioDeHoje).sort((a, b) => ordena(b, a)),
  };
}
