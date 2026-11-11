// Detalhe do empreendimento (Gabriel): fotos, valores, book/tabela e envio ao cliente.
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Image, Linking, ScrollView, Share, Text, View } from "react-native";
import { Botao, Cartao, Erro, Selo, s } from "../componentes/ui";
import { buscarEmpreendimento, listarDocumentos, urlDoDocumento } from "../api/servicos";
import { FASES, SEGMENTOS, faixa, mensagemDoEmpreendimento, prazoDoEmpreendimento, precoDoEmpreendimento } from "../lib/preco";
import { SITE_URL } from "../config";
import { cores } from "../tema";

const LARGURA = Dimensions.get("window").width;

export default function EmpreendimentoTela({ route, navigation }) {
  const { id, resumo } = route.params;
  const [emp, setEmp] = useState(resumo ?? { id });
  const [docs, setDocs] = useState(null);
  const [erroDocs, setErroDocs] = useState("");
  const [carregandoDocs, setCarregandoDocs] = useState(true);
  const [erro, setErro] = useState("");
  const [abrindo, setAbrindo] = useState(null);

  const carregarDocumentos = useCallback(async () => {
    setCarregandoDocs(true);
    setErroDocs("");
    try {
      const dados = await listarDocumentos(id);
      setDocs(Array.isArray(dados) ? dados : []);
    } catch (e) {
      // Não confunda falha de comunicação com ausência de documentos.
      setErroDocs(e.message || "Não foi possível carregar os documentos.");
    } finally {
      setCarregandoDocs(false);
    }
  }, [id]);

  useEffect(() => {
    navigation.setOptions({ title: resumo?.nome ?? "Empreendimento" });
    setDocs(null);
    setErro("");
    buscarEmpreendimento(id).then((d) => setEmp((a) => ({ ...a, ...d }))).catch((e) => setErro(e.message));
    carregarDocumentos();
  }, [id, navigation, resumo?.nome, carregarDocumentos]);

  const fotos = useMemo(() => {
    const galeria = [...(emp.imagens ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)).map((i) => i.url);
    return [emp.capa_url, ...galeria].filter(Boolean).filter((u, i, l) => l.indexOf(u) === i);
  }, [emp]);

  const preco = precoDoEmpreendimento(emp);
  const link = `${SITE_URL}/imoveis/${emp.id}`;
  const dados = [
    ["Quartos", faixa(emp.quartos_min, emp.quartos_max, "quarto", "quartos")],
    ["Vagas", faixa(emp.vagas_min, emp.vagas_max, "vaga", "vagas")],
    [preco.rotulo, preco.temValor ? `${preco.valor}${preco.sufixo}` : null],
    ["Segmento", SEGMENTOS[emp.segmento]],
    ["Prazo", prazoDoEmpreendimento(emp)],
  ].filter(([, v]) => v);

  async function abrirDoc(doc) {
    setAbrindo(doc.id ?? doc.tipo);
    try {
      const url = await urlDoDocumento(emp.id, doc);
      if (url) await Linking.openURL(url);
    } catch (e) {
      setErro(e.message);
    } finally {
      setAbrindo(null);
    }
  }

  const texto = mensagemDoEmpreendimento(emp, link);

  return (
    <ScrollView style={s.tela} contentContainerStyle={{ paddingBottom: 32 }}>
      {fotos.length > 0 && (
        <FlatList horizontal pagingEnabled data={fotos} keyExtractor={(u) => u} showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <Image source={{ uri: item }} style={{ width: LARGURA, height: LARGURA * 0.66, backgroundColor: cores.cartao2 }} />} />
      )}
      <View style={s.conteudo}>
        <Text style={s.titulo}>{emp.nome}</Text>
        <View style={[s.linha, { flexWrap: "wrap" }]}>
          <Selo texto={FASES[emp.status] ?? emp.status ?? "—"} cor={cores.info} />
          {emp.disponivel === false && <Selo texto="Indisponível" cor={cores.perigo} />}
          {emp.construtora?.nome ? <Text style={s.texto3}>{emp.construtora.nome}</Text> : null}
        </View>
        <Text style={s.texto2}>{[emp.endereco, emp.bairro, emp.cidade && `${emp.cidade}/${emp.uf}`].filter(Boolean).join(" · ")}</Text>
        {emp.localizacao_aproximada ? <Text style={s.texto3}>Localização aproximada: confirme o endereço com a construtora.</Text> : null}
        <Erro texto={erro} />

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {dados.map(([rotulo, valor]) => (
            <Cartao key={rotulo} estilo={{ width: (LARGURA - 42) / 2, padding: 12, gap: 2 }}>
              <Text style={s.texto3}>{rotulo}</Text>
              <Text style={[s.texto, { fontWeight: "700" }]}>{valor}</Text>
            </Cartao>
          ))}
        </View>

        {emp.descricao ? <Text style={[s.texto2, { lineHeight: 21 }]}>{emp.descricao}</Text> : null}

        <Text style={[s.rotulo, { marginTop: 8 }]}>Material comercial (só para a equipe)</Text>
        {carregandoDocs && docs === null ? (
          <View style={[s.linha, { justifyContent: "center", padding: 12 }]}>
            <ActivityIndicator color={cores.dourado} />
            <Text style={s.texto3}>Carregando documentos...</Text>
          </View>
        ) : null}
        <Erro texto={erroDocs} />
        {erroDocs ? <Botao tipo="contorno" titulo="Tentar carregar documentos novamente" carregando={carregandoDocs} onPress={carregarDocumentos} /> : null}
        {!carregandoDocs && !erroDocs && docs?.length === 0 ? <Text style={s.texto3}>Ainda não há book nem tabela aprovados.</Text> : null}
        {docs?.length > 0 ? docs.map((d) => (
            <Botao key={d.id ?? d.tipo} tipo="contorno" icone={d.tipo === "book" ? "book-outline" : "pricetag-outline"}
              titulo={`${d.tipo === "book" ? "Abrir book" : "Abrir tabela"}${d.fase ? ` — ${d.fase}` : ""}`}
              carregando={abrindo === (d.id ?? d.tipo)} onPress={() => abrirDoc(d)} />
          )) : null}

        {emp.publicado !== false && emp.disponivel !== false && (
          <>
            <Text style={[s.rotulo, { marginTop: 8 }]}>Mandar para o cliente (vai o link com fotos e mapa; book e tabela ficam para a reunião)</Text>
            <Botao tipo="whatsapp" icone="logo-whatsapp" titulo="Enviar pelo WhatsApp" onPress={() => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(texto)}`)} />
            <Botao tipo="contorno" icone="share-social-outline" titulo="Compartilhar de outro jeito" onPress={() => Share.share({ message: texto })} />
          </>
        )}
        {emp.latitude != null && emp.longitude != null && (
          <Botao tipo="contorno" icone="navigate-outline" titulo="Abrir no mapa"
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${emp.latitude},${emp.longitude}`)} />
        )}
      </View>
    </ScrollView>
  );
}