// Todas as chamadas que as telas usam, num lugar só (Axios por baixo, ver cliente.js).
import { del, get, patch, post } from "./cliente";

// Login, cadastro, saída e perfil (Gabriel / Sofia)
export const entrar = (email, password) => post("/auth/login", { email: email.trim().toLowerCase(), password }, { auth: false });
export const cadastrar = (dados) => post("/auth/register", dados, { auth: false });
export const encerrarSessao = () => post("/auth/logout");
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

// Leads (João): CRUD do lead + relacionamento lead → atividades
export const meusLeads = async () => (await get("/leads/meus")).leads ?? [];
export const buscarLead = async (id) => (await get(`/leads/${id}`)).lead;
export const criarLead = async (dados) => (await post("/leads/meus", dados)).lead;
export const atualizarLead = async (id, dados) => (await patch(`/leads/${id}`, dados)).lead;
export const excluirLead = (id) => del(`/leads/${id}`);
export const mudarStatusLead = async (id, status) => (await patch(`/leads/${id}/status`, { status })).lead;
export const listarAtividades = async (leadId) => (await get(`/leads/${leadId}/atividades`)).atividades ?? [];
export const registrarAtividade = async (leadId, dados) => (await post(`/leads/${leadId}/atividades`, dados)).atividade;
export const atualizarAtividade = async (leadId, id, dados) => (await patch(`/leads/${leadId}/atividades/${id}`, dados)).atividade;
export const excluirAtividade = (leadId, id) => del(`/leads/${leadId}/atividades/${id}`);
export const meusRetornos = async () => (await get("/leads/retornos")).retornos ?? [];
export const minhaRoleta = () => get("/roleta/minha");
export const levarParaCarteira = async (leadId) => (await post(`/leads/${leadId}/cliente`)).cliente;

// Avisos no celular (João)
export const inscreverAparelho = (expoToken) => post("/notificacoes/inscricao", { expoToken });
export const cancelarAparelho = (expoToken) => del(`/notificacoes/inscricao?endpoint=${encodeURIComponent(expoToken)}`);

// Agenda (Sérgio)
export const listarAgendamentos = async () => (await get("/agendamentos")).agendamentos ?? [];
export const criarAgendamento = async (dados) => (await post("/agendamentos", dados)).agendamento;
export const atualizarAgendamento = async (id, dados) => (await patch(`/agendamentos/${id}`, dados)).agendamento;
export const excluirAgendamento = (id) => del(`/agendamentos/${id}`);
export const remarcar = async (id, dataHora) => (await patch(`/agendamentos/${id}/data`, { dataHora })).agendamento;
export const mudarStatusAgendamento = async (id, status, extra = {}) => (await patch(`/agendamentos/${id}/status`, { status, ...extra })).agendamento;

// Clientes (Arthur): CRUD do cliente + relacionamento cliente → agendamentos
export const listarClientes = async () => (await get("/clientes")).clientes ?? [];
export const buscarCliente = async (id) => (await get(`/clientes/${id}`)).cliente;
export const criarCliente = async (dados) => (await post("/clientes", dados)).cliente;
export const atualizarCliente = async (id, dados) => (await patch(`/clientes/${id}`, dados)).cliente;
export const excluirCliente = (id) => del(`/clientes/${id}`);
export const agendamentosDoCliente = async (id) => (await get(`/clientes/${id}/agendamentos`)).agendamentos ?? [];
export const agendarParaCliente = async (id, dados) => (await post(`/clientes/${id}/agendamentos`, dados)).agendamento;
export const atualizarAgendamentoDoCliente = async (id, agendamentoId, dados) =>
  (await patch(`/clientes/${id}/agendamentos/${agendamentoId}`, dados)).agendamento;
export const excluirAgendamentoDoCliente = (id, agendamentoId) => del(`/clientes/${id}/agendamentos/${agendamentoId}`);

// Vendas (Sofia)
export const listarVendas = async () => {
  const dados = await get("/vendas");
  return Array.isArray(dados) ? dados : dados?.vendas ?? [];
};
export const meuVgv = () => get("/vendas/vgv");
export const criarVenda = (dados) => post("/vendas", dados);
export const atualizarVenda = (id, dados) => patch(`/vendas/${id}`, dados);
export const excluirVenda = (id) => del(`/vendas/${id}`);
