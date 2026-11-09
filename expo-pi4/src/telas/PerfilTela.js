// Perfil e configurações (Sofia): nome, telefone, trocar senha, avisos e sair.
import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Text } from "react-native";
import { Botao, Campo, Cartao, Erro, s } from "../componentes/ui";
import { atualizarPerfil, meusDados, trocarSenha } from "../api/servicos";
import { useSessao } from "../contexto";
import { ativarAvisosDeLead, desativarAvisosDeLead } from "../notificacoes/push";
import { SITE_URL } from "../config";
import { cores } from "../tema";

export default function PerfilTela() {
  const { usuario, sair, atualizarUsuario } = useSessao();
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
  const [errosSenha, setErrosSenha] = useState({});
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(null);

  useEffect(() => { meusDados().then((u) => setNome(u.nome ?? "")).catch(() => {}); }, []);

  async function salvarPerfil() {
    setSalvando("perfil"); setErro(""); setMsg("");
    try {
      const u = await atualizarPerfil({ nome: nome.trim(), ...(telefone.trim() ? { telefone } : {}) });
      atualizarUsuario(u);
      setMsg("Dados salvos.");
    } catch (e) { setErro(e.message); } finally { setSalvando(null); }
  }

  async function salvarSenha() {
    setSalvando("senha"); setErrosSenha({}); setMsg(""); setErro("");
    try {
      await trocarSenha(senha);
      setSenha({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
      setMsg("Senha alterada.");
    } catch (e) { setErrosSenha(e.fieldErrors ?? {}); if (!Object.keys(e.fieldErrors ?? {}).length) setErro(e.message); } finally { setSalvando(null); }
  }

  async function testarAvisos() {
    const r = await ativarAvisosDeLead();
    Alert.alert(r.ativo ? "Avisos ligados" : "Avisos desligados", r.ativo ? "Você vai receber um aviso quando chegar lead novo." : `Motivo: ${r.motivo}. Confira a permissão de notificações do app.`);
  }

  function confirmarSaida() {
    Alert.alert("Sair do app?", "Você para de receber avisos de lead neste celular.", [
      { text: "Ficar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => { await desativarAvisosDeLead(); await sair(); } },
    ]);
  }

  return (
    <ScrollView style={s.tela} contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
      <Text style={s.titulo}>{usuario?.nome ?? "Meu perfil"}</Text>
      <Text style={s.subtitulo}>{usuario?.email}</Text>
      {msg ? <Text style={{ color: cores.ok }}>{msg}</Text> : null}
      <Erro texto={erro} />

      <Cartao>
        <Text style={[s.texto, { fontWeight: "700" }]}>Meus dados</Text>
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} autoComplete="name" />
        <Campo rotulo="Telefone (WhatsApp)" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" placeholder="(81) 99999-9999" />
        <Botao titulo="Salvar" onPress={salvarPerfil} carregando={salvando === "perfil"} />
      </Cartao>

      <Cartao>
        <Text style={[s.texto, { fontWeight: "700" }]}>Trocar senha</Text>
        <Campo rotulo="Senha atual" secureTextEntry value={senha.senhaAtual} erro={errosSenha.senhaAtual} onChangeText={(v) => setSenha((x) => ({ ...x, senhaAtual: v }))} />
        <Campo rotulo="Nova senha (mín. 8 caracteres)" secureTextEntry value={senha.novaSenha} erro={errosSenha.novaSenha} onChangeText={(v) => setSenha((x) => ({ ...x, novaSenha: v }))} />
        <Campo rotulo="Confirmar nova senha" secureTextEntry value={senha.confirmarSenha} erro={errosSenha.confirmarSenha} onChangeText={(v) => setSenha((x) => ({ ...x, confirmarSenha: v }))} />
        <Botao titulo="Trocar senha" tipo="contorno" onPress={salvarSenha} carregando={salvando === "senha"} />
      </Cartao>

      <Cartao>
        <Text style={[s.texto, { fontWeight: "700" }]}>Avisos de lead novo</Text>
        <Text style={s.texto2}>Ligados automaticamente depois do login. Se não estiverem chegando, toque abaixo.</Text>
        <Botao titulo="Ligar avisos neste celular" tipo="contorno" icone="notifications-outline" onPress={testarAvisos} />
      </Cartao>

      <Botao titulo="Abrir o site da Place" tipo="contorno" icone="globe-outline" onPress={() => Linking.openURL(SITE_URL)} />
      <Botao titulo="Sair" tipo="perigo" icone="log-out-outline" onPress={confirmarSaida} />
    </ScrollView>
  );
}