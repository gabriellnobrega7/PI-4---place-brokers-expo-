// Perfil e configurações (Sofia): nome, telefone, trocar senha, avisos e sair.
import { useEffect, useRef, useState } from "react";
import { Alert, Linking, ScrollView, Switch, Text, View } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Botao, Campo, Cartao, Erro, s } from "../componentes/ui";
import { atualizarPerfil, cancelarAparelho, meusDados, trocarSenha } from "../api/servicos";
import { useSessao } from "../contexto";
import { ativarAvisosDeLead } from "../notificacoes/push";
import { SITE_URL } from "../config";
import { cores } from "../tema";

// Escolha de quem DESLIGOU o aviso neste celular (o push.js liga sozinho no login)
const FLAG_DESLIGADO = "pb_push_desligado";

const soDigitos = (v) => String (v ?? "").replace(/\D/g, "").slice(0, 11);

function formatarTelefone(v){
  const d = soDigitos(v);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Mesmas regras do back (PATCH /auth/senha), para avisar sem ir ao servidor.
function validarSenha({ senhaAtual, novaSenha, confirmarSenha }) {
  const erros = {};
  if (!senhaAtual) erros.senhaAtual = "Informe a senha atual.";
  if (!novaSenha || novaSenha.length < 8) erros.novaSenha = "A nova senha deve ter pelo menos 8 caracteres.";
  else if (novaSenha === senhaAtual) erros.novaSenha = "A nova senha precisa ser diferente da atual.";
  if (confirmarSenha !== novaSenha) erros.confirmarSenha = "As senhas não coincidem.";
  return erros;
}

function mensagemDoMotivo(motivo) {
  const texto = String(motivo ?? "");
  if (texto === "sem permissão") return "Permissão negada. Ative as notificações do app nas configurações do celular.";
  if (texto.includes("eas init")) return "O app ainda não está ligado ao projeto do Expo. Fale com o Arthur.";
  return "Não foi possível ativar agora. No Android o aviso não funciona no Expo Go: use o APK.";
}

async function tokenDoAparelho() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!Device.isDevice || !projectId) return null;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

/** Aviso de lead no celular: ligado por padrão (o push.js registra no login); aqui a pessoa pode desligar. */
function useAvisosNoCelular() {
  const [ativo, setAtivo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      const desligado = await SecureStore.getItemAsync(FLAG_DESLIGADO);
      if (vivo) setAtivo(status === "granted" && !desligado);
    })().catch(() => {});
    return () => { vivo = false; };
  }, []);

  async function cancelarNoServidor() {
    let token = null;
    try { token = await tokenDoAparelho(); } catch { /* Expo Go no Android: nunca houve inscrição */ }
    if (token) await cancelarAparelho(token);
  }

  async function ligar() {
    if (!Device.isDevice) throw new Error("Os avisos no celular só funcionam em um aparelho de verdade.");
    setOcupado(true);
    try {
      const r = await ativarAvisosDeLead();
      if (!r.ativo) throw new Error(mensagemDoMotivo(r.motivo));
      await SecureStore.deleteItemAsync(FLAG_DESLIGADO);
      setAtivo(true);
    } finally { setOcupado(false); }
  }

  async function desligar() {
    setOcupado(true);
    try {
      await cancelarNoServidor();
      await SecureStore.setItemAsync(FLAG_DESLIGADO, "1");
      setAtivo(false);
    } finally { setOcupado(false); }
  }

  /** Na saída: tira este aparelho da conta (com o token pego de novo) e limpa a escolha. */
  async function aoSair() {
    try { await cancelarNoServidor(); } catch { /* sem internet: sai do mesmo jeito */ }
    await SecureStore.deleteItemAsync(FLAG_DESLIGADO).catch(() => {});
  }

  return { ativo, ocupado, ligar, desligar, aoSair };
}

/** Resultado da ação, logo embaixo do botão que a pessoa tocou. */
function Retorno({ retorno }) {
  if (!retorno?.texto) return null;
  if (retorno.tipo === "ok") return <Text style={{ color: cores.ok }} accessibilityLiveRegion="polite">{retorno.texto}</Text>;
  return <Erro texto={retorno.texto} />;
}

function LinhaInterruptor({ titulo, descricao, valor, aoMudar, ocupado }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={s.texto}>{titulo}</Text>
        {descricao ? <Text style={s.texto2}>{descricao}</Text> : null}
      </View>
      <Switch value={valor} onValueChange={aoMudar} disabled={ocupado} accessibilityLabel={titulo} />
    </View>
  );
}

export default function PerfilTela() {
  const { usuario, sair, atualizarUsuario } = useSessao();
  const celular = useAvisosNoCelular();

  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [telefone, setTelefone] = useState("");
  const [telefoneAlterado, setTelefoneAlterado] = useState(false);
  const [errosPerfil, setErrosPerfil] = useState({});
  const [retornoPerfil, setRetornoPerfil] = useState(null);
  const nomeMexido = useRef(false);

  const [senha, setSenha] = useState({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
  const [errosSenha, setErrosSenha] = useState({});
  const [retornoSenha, setRetornoSenha] = useState(null);

  const [avisoEmail, setAvisoEmail] = useState(Boolean(usuario?.avisoLeadEmail));
  const [ocupadoEmail, setOcupadoEmail] = useState(false);
  const [retornoAvisos, setRetornoAvisos] = useState(null);
  const [salvando, setSalvando] = useState(null);

  useEffect(() => {
    let vivo = true;
    meusDados()
      .then((u) => {
        if (!vivo) return;
        if (!nomeMexido.current) setNome(u.nome ?? ""); // não apaga o que a pessoa já digitou
        setAvisoEmail(Boolean(u.avisoLeadEmail));
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  const perfilMudou = nome.trim() !== (usuario?.nome ?? "") || telefoneAlterado;

  async function salvarPerfil() {
    if (!nome.trim()) { setErrosPerfil({ nome: "Informe o nome." }); return; }
    const corpo = {};
    if (nome.trim() !== usuario?.nome) corpo.nome = nome.trim();
    if (telefoneAlterado) corpo.telefone = soDigitos(telefone); // vazio limpa o telefone

    setSalvando("perfil"); setErrosPerfil({}); setRetornoPerfil(null);
    try {
      const u = await atualizarPerfil(corpo);
      atualizarUsuario(u);
      setTelefoneAlterado(false);
      setRetornoPerfil({ tipo: "ok", texto: "Dados salvos." });
    } catch (e) {
      const campos = e.fieldErrors ?? {};
      setErrosPerfil(campos);
      setRetornoPerfil({ tipo: "erro", texto: Object.keys(campos).length ? "Verifique os campos destacados." : e.message });
    } finally { setSalvando(null); }
  }

  async function salvarSenha() {
    const erros = validarSenha(senha);
    setErrosSenha(erros); setRetornoSenha(null);
    if (Object.keys(erros).length) return;

    setSalvando("senha");
    try {
      await trocarSenha(senha);
      setSenha({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
      setRetornoSenha({ tipo: "ok", texto: "Senha alterada." });
    } catch (e) {
      const campos = e.fieldErrors ?? {};
      setErrosSenha(campos);
      setRetornoSenha({ tipo: "erro", texto: Object.keys(campos).length ? "Verifique os campos destacados." : e.message });
    } finally { setSalvando(null); }
  }

  async function alternarEmail(valor) {
    setAvisoEmail(valor); // muda na hora; volta atrás se o servidor recusar
    setOcupadoEmail(true); setRetornoAvisos(null);
    try {
      const u = await atualizarPerfil({ avisoLeadEmail: valor });
      atualizarUsuario(u);
    } catch (e) {
      setAvisoEmail(!valor);
      setRetornoAvisos({ tipo: "erro", texto: e.message });
    } finally { setOcupadoEmail(false); }
  }

  async function alternarCelular(valor) {
    setRetornoAvisos(null);
    try {
      if (valor) await celular.ligar();
      else await celular.desligar();
    } catch (e) { setRetornoAvisos({ tipo: "erro", texto: e.message }); }
  }

  async function abrirSite() {
    try { await Linking.openURL(SITE_URL); }
    catch { Alert.alert("Não deu para abrir", `Acesse ${SITE_URL} no navegador.`); }
  }

  async function testarAvisos() {
    const r = await ativarAvisosDeLead();
    Alert.alert(r.ativo ? "Avisos ligados" : "Avisos desligados", r.ativo ? "Você vai receber um aviso quando chegar lead novo." : `Motivo: ${r.motivo}. Confira a permissão de notificações do app.`);
  }

  function confirmarSaida() {
    Alert.alert("Sair do app?", "Você para de receber avisos de lead neste celular.", [
      { text: "Ficar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await celular.aoSair(); // antes de apagar a sessão: o token ainda vale
          await sair();
        },
      },
    ]);
  }

  const campoSenha = (chave) => (v) => setSenha((x) => ({...x,[chave]: v}));


  return (
    <ScrollView
      style={s.tela}
      contentContainerStyle={s.conteudo}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={s.titulo}>{usuario?.nome ?? "Meu perfil"}</Text>
      <Text style={s.subtitulo}>{usuario?.email}</Text>

      <Cartao>
        <Text style={[s.texto, { fontWeight: "700" }]}>Meus dados</Text>
        <Campo rotulo="Nome" value={nome} onChangeText={(v) => { nomeMexido.current = true; setNome(v); }}
          erro={errosPerfil.nome}
          autoComplete="name"
          autoCapitalize="words"
        />
        <Campo
          rotulo="Telefone (WhatsApp)"
          value={formatarTelefone(telefone)}
          onChangeText={(v) => { setTelefone(soDigitos(v)); setTelefoneAlterado(true); }}
          erro={errosPerfil.telefone}
          keyboardType="phone-pad"
          autoComplete="tel"
          placeholder="(81) 99999-9999"
        />
        <Text style={s.texto2}>Preencha o telefone só se quiser trocar o número. Apagar tudo e salvar remove o número.</Text>
        <Botao titulo="Salvar" onPress={salvarPerfil} carregando={salvando === "perfil"} desativado={!perfilMudou} />
        <Retorno retorno={retornoPerfil} />
      </Cartao>

      <Cartao>
        <Text style={[s.texto, { fontWeight: "700" }]}>Trocar senha</Text>
        <Campo
          rotulo="Senha atual"
          secureTextEntry
          value={senha.senhaAtual}
          erro={errosSenha.senhaAtual}
          onChangeText={campoSenha("senhaAtual")}
          autoComplete="current-password"
          textContentType="password"
        />
        <Campo
          rotulo="Nova senha (mín. 8 caracteres)"
          secureTextEntry
          value={senha.novaSenha}
          erro={errosSenha.novaSenha}
          onChangeText={campoSenha("novaSenha")}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <Campo
          rotulo="Confirmar nova senha"
          secureTextEntry
          value={senha.confirmarSenha}
          erro={errosSenha.confirmarSenha}
          onChangeText={campoSenha("confirmarSenha")}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={salvarSenha}
        />
        <Botao titulo="Trocar senha" tipo="contorno" onPress={salvarSenha} carregando={salvando === "senha"} />
        <Retorno retorno={retornoSenha}/>
      </Cartao>

       <Cartao>
        <Text style={[s.texto, { fontWeight: "700" }]}>Avisos de lead novo</Text>
        <LinhaInterruptor
          titulo="Aviso no celular"
          descricao="Notificação neste aparelho assim que chegar um lead."
          valor={celular.ativo}
          aoMudar={alternarCelular}
          ocupado={celular.ocupado}
        />
        <LinhaInterruptor
          titulo="Aviso por e-mail"
          descricao="Um e-mail a cada lead novo."
          valor={avisoEmail}
          aoMudar={alternarEmail}
          ocupado={ocupadoEmail}
        />
        <Retorno retorno={retornoAvisos} />
      </Cartao>

      <Botao titulo="Abrir o site da Place" tipo="contorno" icone="globe-outline" onPress={abrirSite} />
      <Botao titulo="Sair" tipo="perigo" icone="log-out-outline" onPress={confirmarSaida} />
    </ScrollView>
  );
}