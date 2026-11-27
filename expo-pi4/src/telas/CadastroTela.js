import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { SegmentedButtons, Text } from "react-native-paper";
import { useSessao } from "../estado/sessao";
import { Botao, Campo, Erro, s } from "../componentes/ui";
import { cores } from "../tema";

export default function CadastroTela() {
  const router = useRouter();
  const cadastrar = useSessao((estado) => estado.cadastrar);
  const [dados, setDados] = useState({ nome: "", email: "", telefone: "", password: "", confirmPassword: "", vinculo: "interno", creci: "", uf: "PE" });
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);
  const campo = (chave) => (valor) => setDados((d) => ({ ...d, [chave]: valor }));

  async function enviar() {
    setErro("");
    setErros({});
    if (dados.password !== dados.confirmPassword) return setErros({ confirmPassword: "As senhas não conferem." });
    setEnviando(true);
    try {
      await cadastrar({
        ...dados,
        email: dados.email.trim().toLowerCase(),
        nome: dados.nome.trim(),
        role: "corretor",
        creci: dados.vinculo === "externo" ? dados.creci.trim() : null,
        uf: dados.vinculo === "externo" ? dados.uf.trim().toUpperCase() : null,
      });
      setPronto(true);
    } catch (e) {
      setErro(e.message);
      setErros(e.fieldErrors ?? {});
    } finally {
      setEnviando(false);
    }
  }

  if (pronto) {
    return (
      <View style={[s.tela, s.vazio, { padding: 24, gap: 16 }]}>
        <Text style={[s.titulo, { textAlign: "center" }]}>Cadastro enviado</Text>
        <Text style={[s.texto2, { textAlign: "center" }]}>Sua conta fica pendente até o administrador da Place aprovar. Depois disso é só entrar com o seu e-mail e senha.</Text>
        <Botao titulo="Voltar para o login" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.tela}>
      <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={s.subtitulo}>Corretor da Place não precisa de CRECI para entrar; corretor parceiro precisa.</Text>
        <SegmentedButtons
          value={dados.vinculo}
          onValueChange={campo("vinculo")}
          buttons={[{ value: "interno", label: "Corretor da Place" }, { value: "externo", label: "Parceiro" }]}
          theme={{ colors: { secondaryContainer: "rgba(233,173,90,0.18)", onSecondaryContainer: cores.dourado } }}
        />
        <Campo rotulo="Nome completo" value={dados.nome} onChangeText={campo("nome")} erro={erros.nome} autoComplete="name" />
        <Campo rotulo="E-mail" value={dados.email} onChangeText={campo("email")} erro={erros.email} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Campo rotulo="Telefone com DDD" value={dados.telefone} onChangeText={campo("telefone")} erro={erros.telefone} keyboardType="phone-pad" autoComplete="tel" />
        {dados.vinculo === "externo" && <Campo rotulo="CRECI" value={dados.creci} onChangeText={campo("creci")} erro={erros.creci} autoCapitalize="characters" />}
        {dados.vinculo === "externo" && <Campo rotulo="Estado em que atua (UF)" value={dados.uf} onChangeText={campo("uf")} erro={erros.uf} autoCapitalize="characters" maxLength={2} placeholder="Ex.: PE" />}
        <Campo rotulo="Senha" value={dados.password} onChangeText={campo("password")} erro={erros.password} secureTextEntry autoComplete="new-password" placeholder="Mínimo de 8 caracteres" />
        <Campo rotulo="Confirmar senha" value={dados.confirmPassword} onChangeText={campo("confirmPassword")} erro={erros.confirmPassword} secureTextEntry autoComplete="new-password" />
        <Erro texto={erro} />
        <Botao titulo="Criar conta" icone="person-add-outline" onPress={enviar} carregando={enviando} />
        <Botao titulo="Já tenho conta" tipo="contorno" onPress={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}