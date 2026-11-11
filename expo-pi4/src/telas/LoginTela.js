// Login (Gabriel). Mesmo login do site; "Esqueci minha senha" manda o link por e-mail.
// "Cadastre-se" abre o cadastro do site no navegador: a conta fica pendente até o administrador aprovar.
import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Botao, Campo, Erro, s } from "../componentes/ui";
import { useSessao } from "../contexto";
import { esqueciSenha } from "../api/servicos";
import { SITE_URL } from "../config";
import { ALVO, cores } from "../tema";

const CADASTRO_URL = `${SITE_URL}/register`;

export default function LoginTela() {
  const { login } = useSessao();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    setErro("");
    setAviso("");
    if (!email.trim() || !senha) return setErro("Informe e-mail e senha.");
    setEntrando(true);
    try {
      await login(email, senha);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEntrando(false);
    }
  }

  async function esqueci() {
    setErro("");
    if (!email.trim()) return setErro("Digite seu e-mail acima e toque de novo em \"Esqueci minha senha\".");
    try {
      const r = await esqueciSenha(email);
      setAviso(r.message ?? "Se o e-mail estiver cadastrado, enviamos um link.");
    } catch (e) {
      setErro(e.message);
    }
  }

  async function cadastrar() {
    try { await Linking.openURL(CADASTRO_URL); }
    catch { Alert.alert("Não deu para abrir", `Acesse ${CADASTRO_URL} no navegador.`); }
  }

  return (
    <SafeAreaView style={s.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.conteudo, { flexGrow: 1, justifyContent: "center" }]} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Image source={require("../../assets/icone.png")} style={{ width: 96, height: 96 }} accessibilityIgnoresInvertColors />
            <Text style={[s.titulo, { marginTop: 12 }]}>Área do corretor</Text>
            <Text style={s.subtitulo}>Seus leads, a agenda e o catálogo no bolso.</Text>
          </View>
          <Campo rotulo="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="username" />
          <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={entrar} />
          <Erro texto={erro} />
          {aviso ? <Text style={[s.texto2, { color: cores.ok }]}>{aviso}</Text> : null}
          <Botao titulo="Entrar" onPress={entrar} carregando={entrando} />
          <Botao titulo="Esqueci minha senha" tipo="contorno" onPress={esqueci} />
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Cadastre-se"
            accessibilityHint="Abre o cadastro no site"
            onPress={cadastrar}
            style={({ pressed }) => ({ minHeight: ALVO, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={s.texto2}>
              Ainda não tem conta? <Text style={{ color: cores.dourado, fontWeight: "700" }}>Cadastre-se</Text>
            </Text>
          </Pressable>
          <Text style={[s.texto3, { textAlign: "center" }]}>O cadastro é feito no site e fica pendente até o administrador aprovar.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}