// Avisos no celular (João).
// 1) Lead novo: o back manda pelo serviço de push do Expo (precisa do APK/dev build; no Expo Go
//    do Android o push remoto não funciona).
// 2) Lembrete de retorno: notificação local agendada no próprio celular (funciona no Expo Go).
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { cancelarAparelho, inscreverAparelho } from "../api/servicos";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let tokenAtual = null;

async function prepararCanais() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("leads", {
    name: "Lead novo",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 200, 400],
    lightColor: "#e9ad5a",
  });
  await Notifications.setNotificationChannelAsync("lembretes", {
    name: "Lembretes de retorno",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

async function permissao() {
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.granted;
}

/** Depois do login: pede permissão, pega o token do Expo e manda para a API. Nunca derruba o app. */
export async function ativarAvisosDeLead() {
  try {
    await prepararCanais();
    if (!Device.isDevice || !(await permissao())) return { ativo: false, motivo: "sem permissão" };
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return { ativo: false, motivo: "rode `eas init` para ter o projectId" };
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    tokenAtual = data;
    await inscreverAparelho(data);
    return { ativo: true };
  } catch (e) {
    return { ativo: false, motivo: e?.message ?? "erro" };
  }
}

/** No "Sair": para de receber avisos neste celular. */
export async function desativarAvisosDeLead() {
  if (tokenAtual) await cancelarAparelho(tokenAtual).catch(() => {});
  tokenAtual = null;
}

/** Lembrete local com alarme na hora combinada com o cliente. */
export async function agendarLembrete({ quando, nome, nota, leadId }) {
  await prepararCanais();
  if (!(await permissao())) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title: `Retornar para ${nome}`, body: nota || "Hora de ligar para o cliente.", data: { url: "leads", leadId }, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(quando), channelId: "lembretes" },
  });
}

/** Toque na notificação abre a aba de leads. */
export function aoTocarNotificacao(abrirLeads) {
  const sub = Notifications.addNotificationResponseReceivedListener(() => abrirLeads());
  return () => sub.remove();
}