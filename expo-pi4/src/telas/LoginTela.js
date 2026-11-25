// Login (Gabriel). Mesmo login do site; "Esqueci minha senha" manda o link por e-mail.
// "Cadastre-se" abre a tela de cadastro do app (POST /auth/register): a conta fica pendente até o administrador aprovar.
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Botao, Campo, Erro, s } from "../componentes/ui";
import { useSessao } from "../contexto";
import { esqueciSenha } from "../api/servicos";
import { ALVO, cores } from "../tema";

export default function LoginTela() {
  const login = useSessao((estado) => estado.login);
  const router = useRouter();
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

  function cadastrar() {
    router.push("/cadastro");
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
            accessibilityHint="Abre a tela de cadastro"
            onPress={cadastrar}
            style={({ pressed }) => ({ minHeight: ALVO, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={s.texto2}>
              Ainda não tem conta? <Text style={{ color: cores.dourado, fontWeight: "700" }}>Cadastre-se</Text>
            </Text>
          </Pressable>
          <Text style={[s.texto3, { textAlign: "center" }]}>A conta nova fica pendente até o administrador aprovar.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}