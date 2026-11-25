// Dados do servidor com TanStack Query: cache, recarregar ao voltar para a tela e
// atualizar as listas depois de criar, alterar ou excluir (invalidateQueries).
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./servicos";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30 * 1000 },
    mutations: { retry: 0 },
  },
});

export const chaves = {
  empreendimentos: ["empreendimentos"],
  empreendimento: (id) => ["empreendimentos", id],
  documentos: (id) => ["empreendimentos", id, "documentos"],
  leads: ["leads"],
  lead: (id) => ["leads", id],
  atividades: (leadId) => ["leads", leadId, "atividades"],
  roleta: ["roleta"],
  retornos: ["retornos"],
  agendamentos: ["agendamentos"],
  clientes: ["clientes"],
  cliente: (id) => ["clientes", id],
  agendamentosDoCliente: (id) => ["clientes", id, "agendamentos"],
  vendas: ["vendas"],
  vgv: ["vendas", "vgv"],
};

const comoLista = (dados, campo) => (Array.isArray(dados) ? dados : dados?.[campo] ?? []);

// ---------- Consultas ----------
export const useEmpreendimentos = () =>
  useQuery({ queryKey: chaves.empreendimentos, queryFn: async () => comoLista(await api.listarEmpreendimentos(), "empreendimentos") });
export const useEmpreendimento = (id) =>
  useQuery({ queryKey: chaves.empreendimento(id), queryFn: () => api.buscarEmpreendimento(id), enabled: Boolean(id) });
export const useDocumentos = (id) =>
  useQuery({ queryKey: chaves.documentos(id), queryFn: async () => comoLista(await api.listarDocumentos(id), "documentos"), enabled: Boolean(id) });

// Leads: confere lead novo a cada minuto com o app aberto.
export const useMeusLeads = () => useQuery({ queryKey: chaves.leads, queryFn: api.meusLeads, refetchInterval: 60 * 1000 });
export const useLead = (id) => useQuery({ queryKey: chaves.lead(id), queryFn: () => api.buscarLead(id), enabled: Boolean(id) });
export const useAtividades = (leadId) =>
  useQuery({ queryKey: chaves.atividades(leadId), queryFn: () => api.listarAtividades(leadId), enabled: Boolean(leadId) });
export const useMinhaRoleta = () => useQuery({ queryKey: chaves.roleta, queryFn: () => api.minhaRoleta().catch(() => null) });
export const useRetornos = () => useQuery({ queryKey: chaves.retornos, queryFn: api.meusRetornos });

export const useAgendamentos = () => useQuery({ queryKey: chaves.agendamentos, queryFn: api.listarAgendamentos });
export const useClientes = () => useQuery({ queryKey: chaves.clientes, queryFn: api.listarClientes });
export const useCliente = (id) => useQuery({ queryKey: chaves.cliente(id), queryFn: () => api.buscarCliente(id), enabled: Boolean(id) });
export const useAgendamentosDoCliente = (id) =>
  useQuery({ queryKey: chaves.agendamentosDoCliente(id), queryFn: () => api.agendamentosDoCliente(id), enabled: Boolean(id) });

export const useVendas = () => useQuery({ queryKey: chaves.vendas, queryFn: api.listarVendas });
export const useVgv = () => useQuery({ queryKey: chaves.vgv, queryFn: api.meuVgv });

// ---------- Mudanças ----------
/** Mutação que, ao dar certo, recarrega as listas afetadas. */
function useMudanca(fn, chavesAfetadas) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all(chavesAfetadas.map((queryKey) => qc.invalidateQueries({ queryKey }))),
  });
}

// Leads + atividades
export const useCriarLead = () => useMudanca((dados) => api.criarLead(dados), [chaves.leads]);
export const useAtualizarLead = () => useMudanca(({ id, dados }) => api.atualizarLead(id, dados), [chaves.leads]);
export const useExcluirLead = () => useMudanca((id) => api.excluirLead(id), [chaves.leads]);
export const useMudarStatusLead = () => useMudanca(({ id, status }) => api.mudarStatusLead(id, status), [chaves.leads]);
export const useCriarAtividade = (leadId) =>
  useMudanca((dados) => api.registrarAtividade(leadId, dados), [chaves.atividades(leadId), chaves.retornos]);
export const useAtualizarAtividade = (leadId) =>
  useMudanca(({ id, dados }) => api.atualizarAtividade(leadId, id, dados), [chaves.atividades(leadId), chaves.retornos]);
export const useExcluirAtividade = (leadId) =>
  useMudanca((id) => api.excluirAtividade(leadId, id), [chaves.atividades(leadId), chaves.retornos]);

// Clientes + agendamentos do cliente
export const useCriarCliente = () => useMudanca((dados) => api.criarCliente(dados), [chaves.clientes]);
export const useAtualizarCliente = () => useMudanca(({ id, dados }) => api.atualizarCliente(id, dados), [chaves.clientes]);
export const useExcluirCliente = () => useMudanca((id) => api.excluirCliente(id), [chaves.clientes]);
export const useAgendarParaCliente = (clienteId) =>
  useMudanca((dados) => api.agendarParaCliente(clienteId, dados), [chaves.agendamentosDoCliente(clienteId), chaves.agendamentos]);
export const useAtualizarAgendamentoDoCliente = (clienteId) =>
  useMudanca(({ id, dados }) => api.atualizarAgendamentoDoCliente(clienteId, id, dados), [chaves.agendamentosDoCliente(clienteId), chaves.agendamentos]);
export const useExcluirAgendamentoDoCliente = (clienteId) =>
  useMudanca((id) => api.excluirAgendamentoDoCliente(clienteId, id), [chaves.agendamentosDoCliente(clienteId), chaves.agendamentos]);

// Agenda
export const useCriarAgendamento = () => useMudanca((dados) => api.criarAgendamento(dados), [chaves.agendamentos, chaves.clientes]);
export const useRemarcar = () => useMudanca(({ id, dataHora }) => api.remarcar(id, dataHora), [chaves.agendamentos, chaves.clientes]);
export const useMudarStatusAgendamento = () =>
  useMudanca(({ id, status, extra }) => api.mudarStatusAgendamento(id, status, extra), [chaves.agendamentos, chaves.clientes]);
export const useExcluirAgendamento = () => useMudanca((id) => api.excluirAgendamento(id), [chaves.agendamentos, chaves.clientes]);

// Vendas
export const useCriarVenda = () => useMudanca((dados) => api.criarVenda(dados), [chaves.vendas]);
export const useAtualizarVenda = () => useMudanca(({ id, dados }) => api.atualizarVenda(id, dados), [chaves.vendas]);
export const useExcluirVenda = () => useMudanca((id) => api.excluirVenda(id), [chaves.vendas]);
