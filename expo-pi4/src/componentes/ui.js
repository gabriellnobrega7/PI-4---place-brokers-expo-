// Peças visuais reaproveitadas pelas telas (Sofia), montadas sobre o UI Kit React Native Paper.
// Mantém os mesmos nomes de antes (Botao, Campo, Cartao...) para as telas não mudarem.
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Card, Chip as ChipPaper, HelperText, Text, TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { ALVO, cores, raio } from "../tema";

export const iconeIonicons = (nome) => (nome ? ({ size, color }) => <Ionicons name={nome} size={size} color={color} /> : undefined);

export function Botao({ titulo, onPress, tipo = "principal", icone, desativado, carregando, estilo }) {
  const modo = tipo === "principal" || tipo === "whatsapp" ? "contained" : "outlined";
  const cor = { principal: cores.dourado, whatsapp: cores.whatsapp }[tipo];
  const corTexto = { principal: "#1a1408", whatsapp: "#06210f", perigo: cores.perigo, contorno: cores.texto }[tipo];
  return (
    <Button
      mode={modo}
      onPress={onPress}
      disabled={desativado || carregando}
      loading={carregando}
      icon={iconeIonicons(icone)}
      buttonColor={cor}
      textColor={corTexto}
      accessibilityLabel={titulo}
      style={[{ borderRadius: raio.medio, borderColor: tipo === "perigo" ? cores.perigo : cores.linha }, estilo]}
      contentStyle={{ minHeight: ALVO }}
      labelStyle={{ fontSize: 15, fontWeight: "700" }}
    >
      {titulo}
    </Button>
  );
}

export function Cartao({ children, estilo }) {
  return (
    <Card mode="outlined" style={[s.cartaoPaper, estilo?.borderColor ? { borderColor: estilo.borderColor } : null]}>
      <Card.Content style={[{ gap: 10 }, estilo]}>{children}</Card.Content>
    </Card>
  );
}

export function Selo({ texto, cor = cores.texto3 }) {
  return (
    <View style={[s.selo, { borderColor: cor }]}>
      <Text style={[s.seloTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

export function Campo({ rotulo, erro, style, ...props }) {
  return (
    <View>
      <TextInput
        mode="outlined"
        label={rotulo}
        error={Boolean(erro)}
        outlineColor={cores.linha}
        activeOutlineColor={cores.dourado}
        textColor={cores.texto}
        placeholderTextColor={cores.texto3}
        style={[{ backgroundColor: cores.cartao2 }, style]}
        {...props}
      />
      {erro ? <HelperText type="error" visible>{erro}</HelperText> : null}
    </View>
  );
}

export function Chip({ texto, ativo, onPress }) {
  return (
    <ChipPaper
      mode="outlined"
      selected={Boolean(ativo)}
      showSelectedCheck={false}
      onPress={onPress}
      style={[{ borderColor: ativo ? cores.dourado : cores.linha, backgroundColor: ativo ? "rgba(233,173,90,0.15)" : "transparent" }]}
      textStyle={{ color: ativo ? cores.dourado : cores.texto2, fontSize: 14 }}
      accessibilityState={{ selected: Boolean(ativo) }}
    >
      {texto}
    </ChipPaper>
  );
}

export function Vazio({ titulo, texto, icone = "file-tray-outline" }) {
  return (
    <View style={s.vazio}>
      <Ionicons name={icone} size={36} color={cores.texto3} />
      <Text style={s.vazioTitulo}>{titulo}</Text>
      {texto ? <Text style={s.vazioTexto}>{texto}</Text> : null}
    </View>
  );
}

export const Carregando = () => (
  <View style={[s.vazio, { flex: 1, backgroundColor: cores.pagina }]}><ActivityIndicator color={cores.dourado} size="large" /></View>
);

export const Erro = ({ texto }) => (texto ? <HelperText type="error" visible style={{ fontSize: 14, paddingHorizontal: 0 }} accessibilityRole="alert">{texto}</HelperText> : null);

export const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.pagina },
  conteudo: { padding: 16, gap: 12 },
  titulo: { color: cores.texto, fontSize: 22, fontWeight: "700" },
  subtitulo: { color: cores.texto2, fontSize: 14 },
  texto: { color: cores.texto, fontSize: 15 },
  texto2: { color: cores.texto2, fontSize: 14 },
  texto3: { color: cores.texto3, fontSize: 13 },
  rotulo: { color: cores.texto2, fontSize: 13 },
  erro: { color: cores.perigo, fontSize: 12 },
  botao: { minHeight: ALVO, borderRadius: raio.medio, borderWidth: 1, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  botaoTexto: { fontSize: 15, fontWeight: "700" },
  cartao: { backgroundColor: cores.cartao, borderColor: cores.linha, borderWidth: 1, borderRadius: raio.grande, padding: 16, gap: 10 },
  cartaoPaper: { backgroundColor: cores.cartao, borderColor: cores.linha, borderRadius: raio.grande },
  selo: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" },
  seloTexto: { fontSize: 12, fontWeight: "600" },
  campo: { minHeight: ALVO, borderRadius: raio.medio, borderWidth: 1, borderColor: cores.linha, backgroundColor: cores.cartao2, color: cores.texto, paddingHorizontal: 14, fontSize: 16 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: cores.linha, justifyContent: "center" },
  vazio: { alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  vazioTitulo: { color: cores.texto, fontSize: 16, fontWeight: "600", textAlign: "center" },
  vazioTexto: { color: cores.texto2, fontSize: 14, textAlign: "center" },
  linha: { flexDirection: "row", alignItems: "center", gap: 8 },
});
