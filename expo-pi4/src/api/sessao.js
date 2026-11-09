// Guarda o token no cofre do celular (Keychain no iPhone, Keystore no Android), nunca em texto puro.
import * as SecureStore from "expo-secure-store";

const CHAVE = "placebrokers.sessao";

export async function lerSessao() {
  try {
    const valor = await SecureStore.getItemAsync(CHAVE);
    return valor ? JSON.parse(valor) : null;
  } catch {
    return null;
  }
}

export async function salvarSessao(sessao) {
  await SecureStore.setItemAsync(CHAVE, JSON.stringify(sessao));
}

export async function apagarSessao() {
  await SecureStore.deleteItemAsync(CHAVE).catch(() => {});
}