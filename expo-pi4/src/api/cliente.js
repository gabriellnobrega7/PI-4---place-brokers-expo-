// Cliente HTTP do app (Axios): mesma API do site, documentada em /docs e na coleção do Postman do back.
// O token vale 1 hora; quando a API responde 401, troca pelo refreshToken (POST /auth/renovar)
// e repete o pedido uma vez. Se não der, apaga a sessão e avisa o app (volta para o login).
import axios from "axios";
import { API_URL } from "../config";
import { apagarSessao, lerSessao, salvarSessao } from "./sessao";

let aoExpirar = () => {};
export const quandoSessaoExpirar = (fn) => { aoExpirar = fn; };

export class ErroApi extends Error {
  constructor(mensagem, { status = 0, code, fieldErrors = {} } = {}) {
    super(mensagem);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export const http = axios.create({
  baseURL: API_URL,
  timeout: 30000, // a API no plano grátis do Render pode levar alguns segundos para acordar
  headers: { Accept: "application/json" },
});

// Envia o token em toda requisição, menos nas marcadas com semLogin (login, cadastro, renovar).
http.interceptors.request.use(async (config) => {
  if (!config.semLogin) {
    const sessao = await lerSessao();
    if (sessao?.token) config.headers.Authorization = `Bearer ${sessao.token}`;
  }
  return config;
});

let renovando = null;
async function renovarToken() {
  if (!renovando) {
    renovando = (async () => {
      const sessao = await lerSessao();
      if (!sessao?.refreshToken) return null;
      try {
        const { data } = await http.post("/auth/renovar", { refreshToken: sessao.refreshToken }, { semLogin: true, semRenovar: true });
        const nova = { ...sessao, token: data.token, refreshToken: data.refreshToken ?? sessao.refreshToken, user: data.user ?? sessao.user };
        await salvarSessao(nova);
        return nova.token;
      } catch {
        return null;
      }
    })().finally(() => { renovando = null; });
  }
  return renovando;
}

function paraErroApi(erro) {
  if (erro instanceof ErroApi) return erro;
  if (!erro.response) return new ErroApi("Sem conexão com o servidor. Confira a internet e tente de novo.");
  const dados = erro.response.data ?? {};
  const corpo = dados?.error && typeof dados.error === "object" ? dados.error : dados;
  return new ErroApi(corpo?.message || "Não foi possível completar agora.", {
    status: erro.response.status,
    code: corpo?.code,
    fieldErrors: corpo?.fieldErrors ?? {},
  });
}

http.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    const config = erro.config;
    if (erro.response?.status === 401 && config && !config.semLogin && !config.semRenovar) {
      if (!config.jaRepetiu) {
        config.jaRepetiu = true;
        const novo = await renovarToken();
        if (novo) {
          config.headers.Authorization = `Bearer ${novo}`;
          return http(config);
        }
      }
      await apagarSessao();
      aoExpirar();
      throw new ErroApi("Sua sessão terminou. Entre de novo.", { status: 401 });
    }
    throw paraErroApi(erro);
  }
);

/** @param {string} caminho @param {{ method?: string, body?: any, auth?: boolean }} opcoes */
export async function api(caminho, { method = "GET", body, auth = true } = {}) {
  const { data } = await http.request({ url: caminho, method, data: body, semLogin: !auth });
  return data ?? {};
}

export const get = (c, o) => api(c, { ...o, method: "GET" });
export const post = (c, body, o) => api(c, { ...o, method: "POST", body });
export const patch = (c, body, o) => api(c, { ...o, method: "PATCH", body });
export const del = (c, o) => api(c, { ...o, method: "DELETE" });
