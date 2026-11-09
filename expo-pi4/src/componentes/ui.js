// Peças visuais reaproveitadas pelas telas (mesma cara do site: fundo azul-escuro e dourado).
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ALVO, cores, raio } from "../tema";

export function Botao({ titulo, onPress, tipo = "principal", icone, desativado, carregando, estilo }) {
  const fundo = { principal: cores.dourado, whatsapp: cores.whatsapp, perigo: "transparent", contorno: "transparent" }[tipo];
  const borda = { perigo: cores.perigo, contorno: cores.linha }[tipo] ?? fundo;
  const corTexto = { principal: "#1a1408", whatsapp: "#06210f", perigo: cores.perigo, contorno: cores.texto }[tipo];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      onPress={onPress}
      disabled={desativado || carregando}
      style={({ pressed }) => [s.botao, { backgroundColor: fundo, borderColor: borda, opacity: desativado ? 0.5 : pressed ? 0.85 : 1 }, estilo]}
    >
      {carregando ? <ActivityIndicator color={corTexto} /> : (
        <>
          {icone && <Ionicons name={icone} size={18} color={corTexto} />}
          <Text style={[s.botaoTexto, { color: corTexto }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Cartao({ children, estilo }) {
  return <View style={[s.cartao, estilo]}>{children}</View>;
}

export function Selo({ texto, cor = cores.texto3 }) {
  return (
    <View style={[s.selo, { borderColor: cor }]}>
      <Text style={[s.seloTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

export function Campo({ rotulo, erro, ...props }) {
  return (
    <View style={{ gap: 6 }}>
      {rotulo ? <Text style={s.rotulo}>{rotulo}</Text> : null}
      <TextInput placeholderTextColor={cores.texto3} style={[s.campo, erro && { borderColor: cores.perigo }]} {...props} />
      {erro ? <Text style={s.erro}>{erro}</Text> : null}
    </View>
  );
}

export function Chip({ texto, ativo, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: ativo }}
      style={[s.chip, ativo && { borderColor: cores.dourado, backgroundColor: "rgba(233,173,90,0.15)" }]}>
      <Text style={{ color: ativo ? cores.dourado : cores.texto2, fontSize: 14 }}>{texto}</Text>
    </Pressable>
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
  <View style={[s.vazio, { flex: 1 }]}><ActivityIndicator color={cores.dourado} size="large" /></View>
);

export const Erro = ({ texto }) => (texto ? <Text style={[s.erro, { fontSize: 14 }]} accessibilityRole="alert">{texto}</Text> : null);

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
  selo: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" },
  seloTexto: { fontSize: 12, fontWeight: "600" },
  campo: { minHeight: ALVO, borderRadius: raio.medio, borderWidth: 1, borderColor: cores.linha, backgroundColor: cores.cartao2, color: cores.texto, paddingHorizontal: 14, fontSize: 16 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: cores.linha, justifyContent: "center" },
  vazio: { alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  vazioTitulo: { color: cores.texto, fontSize: 16, fontWeight: "600", textAlign: "center" },
  vazioTexto: { color: cores.texto2, fontSize: 14, textAlign: "center" },
  linha: { flexDirection: "row", alignItems: "center", gap: 8 },
});