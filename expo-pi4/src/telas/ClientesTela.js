// Clientes (Arthur): a carteira do corretor. Lista com busca; tocar abre o cliente.
import { useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { FAB, List, Searchbar, Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useClientes } from "../api/consultas";
import { Carregando, Erro, Vazio, s } from "../componentes/ui";
import { formatarTelefone } from "../lib/telefone";
import { cores, raio } from "../tema";

const sem = (t = "") => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function ClientesTela() {
  const router = useRouter();
  const consulta = useClientes();
  const [busca, setBusca] = useState("");

  const lista = useMemo(() => {
    const q = sem(busca.trim());
    const digitos = busca.replace(/\D/g, "");
    return (consulta.data ?? []).filter((c) => !q || sem(c.nome).includes(q) || (digitos && String(c.telefone ?? "").includes(digitos)));
  }, [consulta.data, busca]);

  if (consulta.isLoading) return <Carregando />;

  return (
    <View style={s.tela}>
      <FlatList
        contentContainerStyle={[s.conteudo, { paddingBottom: 96 }]}
        data={lista}
        keyExtractor={(c) => String(c.id)}
        refreshControl={<RefreshControl refreshing={consulta.isRefetching} tintColor={cores.dourado} onRefresh={() => consulta.refetch()} />}
        ListHeaderComponent={
          <View style={{ gap: 10 }}>
            <Searchbar placeholder="Buscar por nome ou telefone" value={busca} onChangeText={setBusca}
              style={{ backgroundColor: cores.cartao2, borderRadius: raio.medio }} inputStyle={{ color: cores.texto }}
              iconColor={cores.texto3} placeholderTextColor={cores.texto3} />
            <Erro texto={consulta.error?.message} />
            <Text style={s.texto3}>{lista.length} cliente{lista.length === 1 ? "" : "s"} na carteira</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <List.Item
            title={item.nome}
            description={[formatarTelefone(item.telefone), item.email].filter(Boolean).join(" · ")}
            titleStyle={{ color: cores.texto, fontWeight: "600" }}
            descriptionStyle={{ color: cores.texto2 }}
            style={{ backgroundColor: cores.cartao, borderRadius: raio.grande, borderWidth: 1, borderColor: cores.linha }}
            left={(props) => <View {...props} style={[props.style, { justifyContent: "center" }]}><Ionicons name="person-circle-outline" size={32} color={cores.dourado} /></View>}
            right={(props) => <View {...props} style={[props.style, { justifyContent: "center" }]}><Ionicons name="chevron-forward" size={20} color={cores.texto3} /></View>}
            onPress={() => router.push({ pathname: "/cliente/[id]", params: { id: String(item.id) } })}
            accessibilityRole="button"
          />
        )}
        ListEmptyComponent={<Vazio titulo={busca ? "Nenhum cliente encontrado" : "Sua carteira está vazia"} texto="Cadastre um cliente ou leve um lead para a carteira." icone="briefcase-outline" />}
      />
      <FAB icon={({ size, color }) => <Ionicons name="person-add" size={size} color={color} />} label="Novo cliente"
        style={{ position: "absolute", right: 16, bottom: 16, backgroundColor: cores.dourado }} color="#1a1408"
        onPress={() => router.push("/cliente/novo")} accessibilityLabel="Cadastrar cliente" />
    </View>
  );
}
