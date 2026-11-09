// Cliente HTTP do app: mesma API do site (documentada em /docs e na coleção do Postman do back).
// O token vale 1 hora; quando a API responde 401, troca pelo refreshToken (POST /auth/renovar)
// e repete o pedido uma vez. Se não der, avisa a tela de login.
import { API_URL } from "../config";
import { apagarSessao, lerSessao, salvarSessao } from "./sessao";

let aoExpirar = () => {};
export const quandoSessaoExpirar = (fn) => { aoExpirar = fn; };

let renovando = null;
async function renovarToken() {
  if (!renovando) {
    renovando = (async () => {
      const sessao = await lerSessao();
      if (!sessao?.refreshToken) return null;
      const r = await fetch(`${API_URL}/auth/renovar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: sessao.refreshToken }),
      }).catch(() => null);
      if (!r?.ok) return null;
      const dados = await r.json();
      const nova = { ...sessao, token: dados.token, refreshToken: dados.refreshToken ?? sessao.refreshToken, user: dados.user ?? sessao.user };
      await salvarSessao(nova);
      return nova.token;
    })().finally(() => { renovando = null; });
  }
  return renovando;
}

export class ErroApi extends Error {
  constructor(mensagem, { status = 0, code, fieldErrors = {} } = {}) {
    super(mensagem);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

/** @param {string} caminho @param {{ method?: string, body?: any, auth?: boolean }} opcoes */
export async function api(caminho, { method = "GET", body, auth = true } = {}, tentativa = 0) {
  const sessao = auth ? await lerSessao() : null;
  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(sessao?.token ? { Authorization: `Bearer ${sessao.token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ErroApi("Sem conexão com o servidor. Confira a internet e tente de novo.");
  }

  if (resposta.status === 401 && auth) {
    const novo = tentativa === 0 ? await renovarToken() : null;
    if (novo) return api(caminho, { method, body, auth }, 1);
    await apagarSessao();
    aoExpirar();
    throw new ErroApi("Sua sessão terminou. Entre de novo.", { status: 401 });
  }

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const erro = dados?.error && typeof dados.error === "object" ? dados.error : dados;
    throw new ErroApi(erro?.message || "Não foi possível completar agora.", { status: resposta.status, code: erro?.code, fieldErrors: erro?.fieldErrors });
  }
  return dados;
}

export const get = (c, o) => api(c, { ...o, method: "GET" });
export const post = (c, body, o) => api(c, { ...o, method: "POST", body });
export const patch = (c, body, o) => api(c, { ...o, method: "PATCH", body });
export const del = (c, o) => api(c, { ...o, method: "DELETE" });