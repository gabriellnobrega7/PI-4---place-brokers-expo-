// Navegação (Gabriel): abas na parte de baixo (fácil de alcançar com o polegar).
import { createNavigationContainerRef, DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useSessao } from "../contexto";
import { Carregando } from "../componentes/ui";
import { ativarAvisosDeLead, aoTocarNotificacao } from "../notificacoes/push";
import LoginTela from "../telas/LoginTela";
import LeadsTela from "../telas/LeadsTela";
import AgendaTela from "../telas/AgendaTela";
import NovoAgendamentoTela from "../telas/NovoAgendamentoTela";
import CatalogoTela from "../telas/CatalogoTela";
import EmpreendimentoTela from "../telas/EmpreendimentoTela";
import PerfilTela from "../telas/PerfilTela";
import { cores } from "../tema";

export const navegacaoRef = createNavigationContainerRef();

const Pilha = createNativeStackNavigator();
const Abas = createBottomTabNavigator();

const tema = { ...DarkTheme, colors: { ...DarkTheme.colors, background: cores.pagina, card: cores.pagina, primary: cores.dourado, text: cores.texto, border: cores.linha } };
const cabecalho = { headerStyle: { backgroundColor: cores.pagina }, headerTintColor: cores.texto, headerShadowVisible: false };
const ICONES = { Leads: "people", Agenda: "calendar", Catálogo: "business", Perfil: "person-circle" };

function AbasPrincipais() {
  return (
    <Abas.Navigator
      screenOptions={({ route }) => ({
        ...cabecalho,
        tabBarActiveTintColor: cores.dourado,
        tabBarInactiveTintColor: cores.texto3,
        tabBarStyle: { backgroundColor: cores.cartao2, borderTopColor: cores.linha, height: 64, paddingBottom: 8 },
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONES[route.name]} color={color} size={size} />,
      })}
    >
      <Abas.Screen name="Leads" component={LeadsTela} options={{ title: "Meus leads" }} />
      <Abas.Screen name="Agenda" component={AgendaTela} />
      <Abas.Screen name="Catálogo" component={CatalogoTela} />
      <Abas.Screen name="Perfil" component={PerfilTela} />
    </Abas.Navigator>
  );
}

export default function Navegacao() {
  const { sessao } = useSessao();

  useEffect(() => {
    if (!sessao) return undefined;
    ativarAvisosDeLead();
    return aoTocarNotificacao(() => { if (navegacaoRef.isReady()) navegacaoRef.navigate("Principal", { screen: "Leads" }); });
  }, [sessao?.user?.id]);

  if (sessao === undefined) return <Carregando />;

  return (
    <NavigationContainer ref={navegacaoRef} theme={tema}>
      <Pilha.Navigator screenOptions={cabecalho}>
        {sessao ? (
          <>
            <Pilha.Screen name="Principal" component={AbasPrincipais} options={{ headerShown: false }} />
            <Pilha.Screen name="Empreendimento" component={EmpreendimentoTela} />
            <Pilha.Screen name="NovoAgendamento" component={NovoAgendamentoTela} options={{ title: "Novo agendamento", presentation: "modal" }} />
          </>
        ) : (
          <Pilha.Screen name="Login" component={LoginTela} options={{ headerShown: false }} />
        )}
      </Pilha.Navigator>
    </NavigationContainer>
  );
}