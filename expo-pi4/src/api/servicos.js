// Todas as chamadas que as telas usam, num lugar só.
import { del, get, patch, post } from "./cliente";

// Login e perfil (Gabriel / Sofia)
export const entrar = (email, password) => post("/auth/login", { email: email.trim().toLowerCase(), password }, { auth: false });
export const esqueciSenha = (email) => post("/auth/esqueci-senha", { email: email.trim().toLowerCase() }, { auth: false });
export const meusDados = async () => (await get("/auth/me")).user;
export const atualizarPerfil = async (dados) => (await patch("/auth/me", dados)).user;
export const trocarSenha = (dados) => patch("/auth/senha", dados);

// Catálogo (Gabriel)
export const listarEmpreendimentos = () => get("/empreendimentos");
export const buscarEmpreendimento = (id) => get(`/empreendimentos/${id}`);
export const listarDocumentos = (id) => get(`/empreendimentos/${id}/documentos`);
export const urlDoDocumento = async (id, doc) =>
  (await get(doc.id ? `/empreendimentos/${id}/documentos/arquivo/${doc.id}` : `/empreendimentos/${id}/documentos/${doc.tipo}`)).url;

// Leads (João)
export const meusLeads = async () => (await get("/leads/meus")).leads ?? [];
export const mudarStatusLead = async (id, status) => (await patch(`/leads/${id}/status`, { status })).lead;
export const registrarAtividade = async (leadId, dados) => (await post(`/leads/${leadId}/atividades`, dados)).atividade;
export const meusRetornos = async () => (await get("/leads/retornos")).retornos ?? [];
export const minhaRoleta = () => get("/roleta/minha");
export const levarParaCarteira = async (leadId) => (await post(`/leads/${leadId}/cliente`)).cliente;

// Avisos no celular (João)
export const inscreverAparelho = (expoToken) => post("/notificacoes/inscricao", { expoToken });
export const cancelarAparelho = (expoToken) => del(`/notificacoes/inscricao?endpoint=${encodeURIComponent(expoToken)}`);

// Agenda (Sérgio)
export const listarAgendamentos = async () => (await get("/agendamentos")).agendamentos ?? [];
export const criarAgendamento = async (dados) => (await post("/agendamentos", dados)).agendamento;
export const remarcar = async (id, dataHora) => (await patch(`/agendamentos/${id}/data`, { dataHora })).agendamento;
export const mudarStatusAgendamento = async (id, status, extra = {}) => (await patch(`/agendamentos/${id}/status`, { status, ...extra })).agendamento;
export const listarClientes = async () => (await get("/clientes")).clientes ?? [];