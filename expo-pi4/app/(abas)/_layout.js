// Abas na parte de baixo (fácil de alcançar com o polegar) e o perfil no canto do topo.
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { IconButton } from "react-native-paper";
import { iconeIonicons } from "../../src/componentes/ui";
import { cores } from "../../src/tema";

const ICONES = { index: "home", leads: "people", agenda: "calendar", clientes: "briefcase", catalogo: "business" };

export default function LayoutAbas() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: cores.pagina },
        headerTintColor: cores.texto,
        headerShadowVisible: false,
        headerRight: () => (
          <IconButton icon={iconeIonicons("person-circle-outline")} iconColor={cores.dourado} size={26}
            accessibilityLabel="Abrir perfil" onPress={() => router.push("/perfil")} />
        ),
        sceneStyle: { backgroundColor: cores.pagina },
        tabBarActiveTintColor: cores.dourado,
        tabBarInactiveTintColor: cores.texto3,
        tabBarStyle: { backgroundColor: cores.cartao2, borderTopColor: cores.linha, height: 64, paddingBottom: 8 },
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONES[route.name] ?? "ellipse"} color={color} size={size} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Início" }} />
      <Tabs.Screen name="leads" options={{ title: "Meus leads", tabBarLabel: "Leads" }} />
      <Tabs.Screen name="agenda" options={{ title: "Agenda" }} />
      <Tabs.Screen name="clientes" options={{ title: "Clientes" }} />
      <Tabs.Screen name="catalogo" options={{ title: "Catálogo" }} />
    </Tabs>
  );
}
