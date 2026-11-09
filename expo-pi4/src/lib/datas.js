const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const dois = (n) => String(n).padStart(2, "0");

export const hora = (d) => `${dois(new Date(d).getHours())}:${dois(new Date(d).getMinutes())}`;

/** "Hoje", "Amanhã", "Ontem" ou "qua, 05/11". */
export function dia(d, agora = new Date()) {
  const a = new Date(d);
  const zero = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dif = Math.round((zero(a) - zero(agora)) / 86400000);
  if (dif === 0) return "Hoje";
  if (dif === 1) return "Amanhã";
  if (dif === -1) return "Ontem";
  return `${DIAS[a.getDay()]}, ${dois(a.getDate())}/${dois(a.getMonth() + 1)}`;
}

/** "agora", "há 5 min", "há 2 h", "há 3 dias". */
export function tempoDesde(d, agora = new Date()) {
  const min = Math.max(0, Math.floor((agora - new Date(d)) / 60000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.floor(h / 24);
  return `há ${dias} dia${dias > 1 ? "s" : ""}`;
}

/** Separa agendamentos em hoje / próximos / histórico. */
export function separarAgenda(lista = [], agora = new Date()) {
  const fimDeHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);
  const inicioDeHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const encerrado = (a) => ["realizado", "nao_compareceu", "cancelado"].includes(a.status);
  const porData = (a, b) => new Date(a.dataHora) - new Date(b.dataHora);
  return {
    hoje: lista.filter((a) => !encerrado(a) && new Date(a.dataHora) >= inicioDeHoje && new Date(a.dataHora) <= fimDeHoje).sort(porData),
    proximos: lista.filter((a) => !encerrado(a) && new Date(a.dataHora) > fimDeHoje).sort(porData),
    historico: lista.filter((a) => encerrado(a) || new Date(a.dataHora) < inicioDeHoje).sort((a, b) => porData(b, a)),
  };
}