// Raiz do app com Expo Router (Gabriel): provedores (TanStack Query, React Native Paper),
// sessão global (Zustand) e quem vê o quê: logado vê as abas, deslogado só login e cadastro.
import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "../src/api/consultas";
import { useSessao } from "../src/estado/sessao";
import { Carregando } from "../src/componentes/ui";
import { ativarAvisosDeLead, aoTocarNotificacao } from "../src/notificacoes/push";
import { cores, temaPaper } from "../src/tema";

const cabecalho = {
  headerStyle: { backgroundColor: cores.pagina },
  headerTintColor: cores.texto,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: cores.pagina },
};

function Rotas() {
  const router = useRouter();
  const sessao = useSessao((estado) => estado.sessao);
  const restaurar = useSessao((estado) => estado.restaurar);
  const logado = Boolean(sessao);

  useEffect(() => { restaurar(); }, [restaurar]);

  // Aviso de lead novo: liga ao entrar e, ao tocar na notificação, abre Meus leads.
  useEffect(() => {
    if (!logado) return undefined;
    ativarAvisosDeLead({ automatico: true });
    return aoTocarNotificacao(() => router.push("/leads"));
  }, [logado, sessao?.user?.id]);

  if (sessao === undefined) return <Carregando />;

  return (
    <Stack screenOptions={cabecalho}>
      <Stack.Protected guard={logado}>
        <Stack.Screen name="(abas)" options={{ headerShown: false }} />
        <Stack.Screen name="perfil" options={{ title: "Perfil" }} />
        <Stack.Screen name="sobre" options={{ title: "Sobre" }} />
        <Stack.Screen name="vendas" options={{ title: "Minhas vendas" }} />
        <Stack.Screen name="novo-agendamento" options={{ title: "Novo agendamento", presentation: "modal" }} />
        <Stack.Screen name="empreendimento/[id]" options={{ title: "Empreendimento" }} />
        <Stack.Screen name="cliente/[id]" options={{ title: "Cliente" }} />
        <Stack.Screen name="cliente/novo" options={{ title: "Novo cliente" }} />
        <Stack.Screen name="cliente/editar/[id]" options={{ title: "Editar cliente" }} />
        <Stack.Screen name="lead/[id]" options={{ title: "Lead" }} />
        <Stack.Screen name="lead/novo" options={{ title: "Cadastrar lead" }} />
        <Stack.Screen name="lead/editar/[id]" options={{ title: "Editar lead" }} />
      </Stack.Protected>
      <Stack.Protected guard={!logado}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="cadastro" options={{ title: "Criar conta" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={temaPaper}>
          <StatusBar style="light" />
          <Rotas />
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
