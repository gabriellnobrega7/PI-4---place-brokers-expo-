// Lead (João): dados do lead e o relacionamento lead → atividades
// (histórico de atendimento: GET/POST/PATCH/DELETE em /leads/:id/atividades).
import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Card, Divider, IconButton, Switch, Text } from "react-native-paper";
import {
  useAtividades, useAtualizarAtividade, useCriarAtividade, useExcluirAtividade, useExcluirLead, useLead, useMudarStatusLead,
} from "../api/consultas";
import { useSessao } from "../estado/sessao";
import { Botao, Campo, Carregando, Cartao, Chip, Erro, Selo, Vazio, iconeIonicons, s } from "../componentes/ui";
import SeletorDataHora from "../componentes/SeletorDataHora";
import { dia, hora } from "../lib/datas";
import { formatarTelefone } from "../lib/telefone";
import { cores, raio } from "../tema";

const TIPOS = { ligacao: "Ligação", whatsapp: "WhatsApp", email: "E-mail", visita: "Visita", observacao: "Anotação" };
const STATUS = { novo: ["Novo", cores.perigo], em_atendimento: ["Em atendimento", cores.info], convertido: ["Convertido", cores.ok], perdido: ["Perdido", cores.texto3] };

function FormAtividade({ leadId, atual, aoFechar }) {
  const criar = useCriarAtividade(leadId);
  const alterar = useAtualizarAtividade(leadId);
  const [tipo, setTipo] = useState(atual?.tipo ?? "ligacao");
  const [descricao, setDescricao] = useState(atual?.descricao ?? "");
  const [comRetorno, setComRetorno] = useState(Boolean(atual?.proximoContatoEm));
  const [retorno, setRetorno] = useState(() => (atual?.proximoContatoEm ? new Date(atual.proximoContatoEm) : new Date(Date.now() + 24 * 3600 * 1000)));
  const [erro, setErro] = useState("");

  async function salvar() {
    setErro("");
    const dados = { tipo, descricao, proximoContatoEm: comRetorno ? retorno.toISOString() : null };
    try {
      if (atual) await alterar.mutateAsync({ id: atual.id, dados });
      else await criar.mutateAsync(dados);
      aoFechar();
    } catch (e) {
      setErro(Object.values(e.fieldErrors ?? {})[0] ?? e.message);
    }
  }

  return (
    <Cartao estilo={{ borderColor: cores.dourado }}>
      <Text style={[s.texto, { fontWeight: "700" }]}>{atual ? "Corrigir atividade" : "Registrar atendimento"}</Text>
      <View style={[s.linha, { flexWrap: "wrap" }]}>
        {Object.entries(TIPOS).map(([k, v]) => <Chip key={k} texto={v} ativo={tipo === k} onPress={() => setTipo(k)} />)}
      </View>
      <Campo rotulo="O que aconteceu" value={descricao} onChangeText={setDescricao} multiline placeholder="Ex.: atendeu, quer visitar no sábado" />
      <View style={[s.linha, { justifyContent: "space-between" }]}>
        <Text style={s.texto2}>Marcar retorno</Text>
        <Switch value={comRetorno} onValueChange={setComRetorno} color={cores.dourado} />
      </View>
      {comRetorno && <SeletorDataHora valor={retorno} aoMudar={setRetorno} minimo={new Date()} />}
      <Erro texto={erro} />
      <View style={s.linha}>
        <Botao titulo="Cancelar" tipo="contorno" onPress={aoFechar} estilo={{ flex: 1 }} />
        <Botao titulo="Salvar" icone="checkmark" onPress={salvar} carregando={criar.isPending || alterar.isPending} estilo={{ flex: 1 }} />
      </View>
    </Cartao>
  );
}

export default function LeadDetalheTela() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const meuId = useSessao((estado) => estado.usuario?.id);
  const lead = useLead(id);
  const atividades = useAtividades(id);
  const mudarStatus = useMudarStatusLead();
  const excluirLead = useExcluirLead();
  const excluirAtividade = useExcluirAtividade(id);
  const [formulario, setFormulario] = useState(null); // null | "novo" | atividade em edição

  useEffect(() => { if (lead.data?.nome) navigation.setOptions({ title: lead.data.nome }); }, [lead.data?.nome, navigation]);

  function trocarStatus() {
    Alert.alert("Mudar status", lead.data.nome, [
      ...["novo", "em_atendimento", "perdido"].filter((k) => k !== lead.data.status).map((k) => ({
        text: STATUS[k][0],
        onPress: () => mudarStatus.mutateAsync({ id, status: k }).then(() => lead.refetch()).catch((e) => Alert.alert("Não deu", e.message)),
      })),
      { text: "Voltar", style: "cancel" },
    ]);
  }

  function confirmarExclusao() {
    Alert.alert("Excluir lead?", "Só sai lead que você mesmo cadastrou e que ainda não tem cliente nem agendamento.", [
      { text: "Voltar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        try { await excluirLead.mutateAsync(id); router.back(); }
        catch (e) { Alert.alert("Não deu para excluir", e.message); }
      } },
    ]);
  }

  function confirmarExclusaoAtividade(a) {
    Alert.alert("Excluir atividade?", a.descricao, [
      { text: "Voltar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => excluirAtividade.mutateAsync(a.id).catch((e) => Alert.alert("Não deu para excluir", e.message)) },
    ]);
  }

  if (lead.isLoading) return <Carregando />;
  if (!lead.data) return <View style={[s.tela, s.vazio]}><Erro texto={lead.error?.message ?? "Lead não encontrado."} /></View>;
  const l = lead.data;
  const [rotuloStatus, corStatus] = STATUS[l.status] ?? STATUS.novo;
  const lista = atividades.data ?? [];

  return (
    <ScrollView style={s.tela} contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
      <Card mode="outlined" style={{ backgroundColor: cores.cartao, borderColor: cores.linha, borderRadius: raio.grande }}>
        <Card.Title title={l.nome} titleStyle={{ color: cores.texto, fontWeight: "700" }}
          subtitle={`${l.origem === "corretor" ? "Captado por você" : "Chegou pelo site"} · ${dia(l.criadoEm)}`} subtitleStyle={{ color: cores.texto3 }}
          right={() => (
            <View style={s.linha}>
              <IconButton icon={iconeIonicons("create-outline")} iconColor={cores.dourado} accessibilityLabel="Editar lead"
                onPress={() => router.push({ pathname: "/lead/editar/[id]", params: { id: String(id) } })} />
              {l.origem === "corretor" && <IconButton icon={iconeIonicons("trash-outline")} iconColor={cores.perigo} accessibilityLabel="Excluir lead" onPress={confirmarExclusao} />}
            </View>
          )} />
        <Card.Content style={{ gap: 6 }}>
          <Text style={[s.texto, { fontSize: 18 }]}>{formatarTelefone(l.telefone)}</Text>
          {l.email ? <Text style={s.texto2}>{l.email}</Text> : null}
          {l.empreendimento ? <Text style={s.texto2}>Interesse: {l.empreendimento.nome}</Text> : null}
          {l.mensagem ? <Text style={s.texto2}>{l.mensagem}</Text> : null}
          <Botao titulo={`Status: ${rotuloStatus} (mudar)`} tipo="contorno" onPress={trocarStatus} estilo={{ borderColor: corStatus, marginTop: 6 }} />
        </Card.Content>
      </Card>

      <Divider style={{ backgroundColor: cores.linha }} />
      <View style={[s.linha, { justifyContent: "space-between" }]}>
        <Text style={[s.texto, { fontWeight: "700" }]}>Histórico ({lista.length})</Text>
        {!formulario && <Botao titulo="Registrar" icone="add" onPress={() => setFormulario("novo")} />}
      </View>
      {formulario && (
        <FormAtividade key={formulario === "novo" ? "novo" : formulario.id} leadId={id}
          atual={formulario === "novo" ? null : formulario} aoFechar={() => setFormulario(null)} />
      )}
      <Erro texto={atividades.error?.message} />
      {lista.length === 0 && !atividades.isLoading && <Vazio titulo="Nenhum atendimento registrado" texto="Ligações e mensagens pelo app entram aqui sozinhas." icone="chatbubbles-outline" />}
      {lista.map((a) => (
        <Cartao key={a.id}>
          <View style={[s.linha, { justifyContent: "space-between" }]}>
            <Selo texto={TIPOS[a.tipo] ?? a.tipo} cor={cores.dourado} />
            <Text style={s.texto3}>{dia(a.criadoEm)} · {hora(a.criadoEm)}</Text>
          </View>
          <Text style={s.texto2}>{a.descricao}</Text>
          {a.proximoContatoEm ? <Text style={{ color: cores.info }}>Retornar em {dia(a.proximoContatoEm)} às {hora(a.proximoContatoEm)}</Text> : null}
          {a.autorId === meuId && (
            <View style={s.linha}>
              <Botao titulo="Corrigir" tipo="contorno" icone="create-outline" onPress={() => setFormulario(a)} estilo={{ flex: 1 }} />
              <Botao titulo="Excluir" tipo="perigo" icone="trash-outline" onPress={() => confirmarExclusaoAtividade(a)} estilo={{ flex: 1 }} />
            </View>
          )}
        </Cartao>
      ))}
    </ScrollView>
  );
}
