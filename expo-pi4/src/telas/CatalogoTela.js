// Catálogo de empreendimentos (Gabriel): busca, segmento e "só disponíveis".
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { Carregando, Chip, Erro, Selo, Vazio, s } from "../componentes/ui";
import { listarEmpreendimentos } from "../api/servicos";
import { FASES, SEGMENTOS, faixa, prazoDoEmpreendimento, precoDoEmpreendimento } from "../lib/preco";
import { cores, raio } from "../tema";

const sem = (t = "") => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Item({ e, onPress }) {
  const preco = precoDoEmpreendimento(e);
  const capa = e.capa_miniatura_url || e.capa_url;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={e.nome}
      style={({ pressed }) => [s.cartao, { flexDirection: "row", padding: 10, opacity: pressed ? 0.85 : 1 }]}>
      {capa ? <Image source={{ uri: capa }} style={{ width: 96, height: 80, borderRadius: raio.pequeno, backgroundColor: cores.cartao2 }} />
        : <View style={{ width: 96, height: 80, borderRadius: raio.pequeno, backgroundColor: cores.cartao2 }} />}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[s.texto, { fontWeight: "700" }]} numberOfLines={1}>{e.nome}</Text>
        <Text style={s.texto3} numberOfLines={1}>{FASES[e.status] ?? e.status} · {[e.bairro !== "A confirmar" ? e.bairro : null, e.cidade].filter(Boolean).join(", ")}</Text>
        <Text style={{ color: preco.temValor ? cores.dourado : cores.texto3, fontWeight: "600" }} numberOfLines={1}>
          {preco.temValor ? `${preco.rotulo === "A partir de" ? "A partir de" : "Parcelas de"} ${preco.valor}${preco.sufixo}` : "Valores sob consulta"}
        </Text>
        <Text style={s.texto3} numberOfLines={1}>{[faixa(e.quartos_min, e.quartos_max, "quarto", "quartos"), prazoDoEmpreendimento(e)].filter(Boolean).join(" · ")}</Text>
        {(e.tem_book || e.tem_tabela || e.disponivel === false) && (
          <View style={[s.linha, { gap: 6 }]}>
            {e.tem_book && <Selo texto="Book" cor={cores.ok} />}
            {e.tem_tabela && <Selo texto="Tabela" cor={cores.ok} />}
            {e.disponivel === false && <Selo texto="Indisponível" cor={cores.perigo} />}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function CatalogoTela({ navigation }) {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const [busca, setBusca] = useState("");
  const [segmento, setSegmento] = useState("");
  const [soDisponiveis, setSoDisponiveis] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setErro("");
      const dados = await listarEmpreendimentos();
      setLista(Array.isArray(dados) ? dados : dados?.empreendimentos ?? []);
    } catch (e) {
      setErro(e.message);
      setLista((l) => l ?? []);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = useMemo(() => {
    const q = sem(busca.trim());
    return (lista ?? [])
      .filter((e) => !segmento || e.segmento === segmento)
      .filter((e) => !soDisponiveis || e.disponivel !== false)
      .filter((e) => !q || sem(`${e.nome} ${e.bairro ?? ""} ${e.cidade ?? ""}`).includes(q));
  }, [lista, busca, segmento, soDisponiveis]);

  if (lista === null) return <Carregando />;

  return (
    <FlatList
      style={s.tela}
      contentContainerStyle={s.conteudo}
      data={filtrados}
      keyExtractor={(e) => String(e.id)}
      refreshControl={<RefreshControl refreshing={atualizando} tintColor={cores.dourado} onRefresh={async () => { setAtualizando(true); await carregar(); setAtualizando(false); }} />}
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar por nome, bairro ou cidade" placeholderTextColor={cores.texto3}
            style={s.campo} returnKeyType="search" accessibilityLabel="Buscar empreendimento" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Chip texto="Todos" ativo={!segmento} onPress={() => setSegmento("")} />
            {Object.entries(SEGMENTOS).map(([k, v]) => <Chip key={k} texto={v} ativo={segmento === k} onPress={() => setSegmento(k)} />)}
            <Chip texto="Só disponíveis" ativo={soDisponiveis} onPress={() => setSoDisponiveis((v) => !v)} />
          </ScrollView>
          <Erro texto={erro} />
          <Text style={s.texto3}>{filtrados.length} empreendimento{filtrados.length === 1 ? "" : "s"}</Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item }) => <Item e={item} onPress={() => navigation.navigate("Empreendimento", { id: item.id, resumo: item })} />}
      ListEmptyComponent={<Vazio titulo="Nenhum empreendimento encontrado" texto="Tente outro nome ou tire os filtros." icone="search-outline" />}
    />
  );
}
