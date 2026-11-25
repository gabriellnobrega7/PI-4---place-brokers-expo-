// Estado global da sessão com Zustand (Gabriel): quem está logado, entrar, cadastrar e sair.
// O token fica no cofre do celular (api/sessao.js); aqui fica só o que as telas precisam ler.
import { create } from "zustand";
import { quandoSessaoExpirar } from "../api/cliente";
import { apagarSessao, lerSessao, salvarSessao } from "../api/sessao";
import { cadastrar, encerrarSessao, entrar } from "../api/servicos";
import { queryClient } from "../api/consultas";

export const useSessao = create((set, get) => ({
  sessao: undefined, // undefined = ainda lendo do cofre; null = deslogado
  usuario: null,

  restaurar: async () => {
    const sessao = await lerSessao();
    set({ sessao: sessao ?? null, usuario: sessao?.user ?? null });
  },

  login: async (email, senha) => {
    const r = await entrar(email, senha);
    // O app é a área do corretor; gerente e admin usam o site.
    if (r.user?.role !== "corretor") {
      throw new Error("O app é a área do corretor. Gerentes e administradores usam o site.");
    }
    const sessao = { token: r.token, refreshToken: r.refreshToken ?? null, user: r.user };
    await salvarSessao(sessao);
    set({ sessao, usuario: sessao.user });
    return sessao;
  },

  /** Cadastro de corretor: a conta fica pendente até o admin aprovar no site. */
  cadastrar: (dados) => cadastrar(dados),

  sair: async () => {
    // Revoga a sessão no servidor (POST /auth/logout); sai do app mesmo sem internet.
    if (get().sessao) await encerrarSessao().catch(() => {});
    await apagarSessao();
    queryClient.clear();
    set({ sessao: null, usuario: null });
  },

  atualizarUsuario: (user) =>
    set((estado) => {
      if (!estado.sessao) return estado;
      const sessao = { ...estado.sessao, user: { ...estado.sessao.user, ...user } };
      salvarSessao(sessao).catch(() => {});
      return { sessao, usuario: sessao.user };
    }),
}));

// Quando o token não renova (sessão encerrada no servidor), volta para o login.
quandoSessaoExpirar(() => {
  queryClient.clear();
  useSessao.setState({ sessao: null, usuario: null });
});
