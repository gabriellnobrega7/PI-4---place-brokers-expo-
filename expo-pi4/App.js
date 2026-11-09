import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessaoProvider } from "./src/contexto";
import Navegacao from "./src/navegacao/Navegacao";

export default function App() {
  return (
    <SafeAreaProvider>
      <SessaoProvider>
        <StatusBar style="light" />
        <Navegacao />
      </SessaoProvider>
    </SafeAreaProvider>
  );
}