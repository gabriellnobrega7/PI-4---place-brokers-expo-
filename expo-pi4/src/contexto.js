// Sessão do usuário para o app inteiro (Gabriel).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { quandoSessaoExpirar } from "./api/cliente";
import { apagarSessao, lerSessao, salvarSessao } from "./api/sessao";
import { entrar } from "./api/servicos";

const Contexto = createContext(null);

export function SessaoProvider({ children }) {
  const [sessao, setSessao] = useState(undefined); // undefined = carregando

  useEffect(() => {
    lerSessao().then((s) => setSessao(s ?? null));
    quandoSessaoExpirar(() => setSessao(null));
  }, []);

  const login = useCallback(async (email, senha) => {
    const r = await entrar(email, senha);
    // O app é a área do corretor; gerente e admin usam o site.
    if (r.user?.role !== "corretor") {
      throw new Error("O app é a área do corretor. Gerentes e administradores usam o site.");
    }
    const nova = { token: r.token, refreshToken: r.refreshToken ?? null, user: r.user };
    await salvarSessao(nova);
    setSessao(nova);
    return nova;
  }, []);

  const sair = useCallback(async () => {
    await apagarSessao();
    setSessao(null);
  }, []);

  const valor = useMemo(() => ({ sessao, usuario: sessao?.user ?? null, login, sair, atualizarUsuario: (user) => setSessao((s) => (s ? { ...s, user: { ...s.user, ...user } } : s)) }), [sessao, login, sair]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useSessao = () => useContext(Contexto);