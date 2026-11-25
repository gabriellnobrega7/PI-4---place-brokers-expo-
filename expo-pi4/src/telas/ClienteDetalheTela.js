// Cliente (Arthur): dados do cliente e o relacionamento cliente → agendamentos
// (GET/POST/PATCH/DELETE em /clientes/:id/agendamentos).
import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, ScrollView, View } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Card, Divider, IconButton, Text } from "react-native-paper";
import {
  useAgendamentosDoCliente, useAgendarParaCliente, useAtualizarAgendamentoDoCliente, useCliente,
  useEmpreendimentos, useExcluirAgendamentoDoCliente, useExcluirCliente,
} from "../api/consultas";
import { Botao, Campo, Carregando, Cartao, Chip, Erro, Selo, Vazio, iconeIonicons, s } from "../componentes/ui";
import SeletorDataHora from "../componentes/SeletorDataHora";
import { dataFutura, dia, hora } from "../lib/datas";
import { formatarTelefone, linkLigar, linkWhatsApp } from "../lib/telefone";
import { cores, raio } from "../tema";

const STATUS = {
  agendado: { rotulo: "Agendado", cor: cores.info },
  confirmado: { rotulo: "Confirmado", cor: cores.ok },
  realizado: { rotulo: "Realizado", cor: cores.dourado },
  nao_compareceu: { rotulo: "Não compareceu", cor: cores.perigo },
  cancelado: { rotulo: "Cancelado", cor: cores.texto3 },
};
const sem = (t = "") => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function amanhaAs10() {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  d.setHours(10, 0, 0, 0);
  return d;
}

/** Formulário de agendamento do cliente: cria (sem `atual`) ou altera (com `atual`). */
function FormAgendamento({ clienteId, atual, aoFechar }) {
  const empreendimentos = useEmpreendimentos();
  const criar = useAgendarParaCliente(clienteId);
  const alterar = useAtualizarAgendamentoDoCliente(clienteId);
  const [tipo, setTipo] = useState(atual?.tipo ?? "visita_imovel");
  const [emp, setEmp] = useState(atual?.empreendimento ?? null);
  const [busca, setBusca] = useState("");
  const [local, setLocal] = useState(atual?.local ?? "");
  const [quando, setQuando] = useState(() => (atual ? new Date(atual.dataHora) : amanhaAs10()));
  const [obs, setObs] = useState(atual?.observacoes ?? "");
  const [status, setStatus] = useState(atual?.status ?? "agendado");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");

  const opcoes = useMemo(() => (empreendimentos.data ?? [])
    .filter((e) => !busca || sem(`${e.nome} ${e.bairro ?? ""}`).includes(sem(busca))).slice(0, 5), [empreendimentos.data, busca]);

  async function salvar() {
    setErro("");
    if (tipo === "visita_imovel" && !emp) return setErro("Escolha o empreendimento da visita.");
    const dataMudou = !atual || new Date(atual.dataHora).getTime() !== quando.getTime();
    if (dataMudou && !dataFutura(quando)) return setErro("Escolha uma data e hora futuras.");
    if (status === "cancelado" && atual?.status !== "cancelado" && !motivo.trim()) return setErro("Informe o motivo do cancelamento.");
    const corpo = {
      tipo,
      empreendimentoId: tipo === "visita_imovel" ? emp.id : null,
      local: tipo === "visita_imovel" ? null : local.trim() || null,
      observacoes: obs.trim() || null,
    };
    try {
      if (atual) {
        await alterar.mutateAsync({
          id: atual.id,
          dados: {
            ...corpo,
            ...(dataMudou ? { dataHora: quando.toISOString() } : {}),
            ...(status !== atual.status ? { status, motivoCancelamento: motivo.trim() || undefined } : {}),
          },
        });
      } else {
        await criar.mutateAsync({ ...corpo, dataHora: quando.toISOString() });
      }
      aoFechar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <Cartao estilo={{ borderColor: cores.dourado }}>
      <Text style={[s.texto, { fontWeight: "700" }]}>{atual ? "Alterar agendamento" : "Novo agendamento"}</Text>
      <View style={[s.linha, { flexWrap: "wrap" }]}>
        <Chip texto="Visita ao imóvel" ativo={tipo === "visita_imovel"} onPress={() => setTipo("visita_imovel")} />
        <Chip texto="Reunião no escritório" ativo={tipo === "reuniao_escritorio"} onPress={() => setTipo("reuniao_escritorio")} />
      </View>
      {tipo === "visita_imovel" ? (
        emp ? <Botao tipo="contorno" titulo={`${emp.nome} (trocar)`} onPress={() => setEmp(null)} /> : (
          <View style={{ gap: 8 }}>
            <Campo rotulo="Empreendimento" value={busca} onChangeText={setBusca} placeholder="Buscar pelo nome ou bairro" />
            {opcoes.map((e) => <Botao key={e.id} tipo="contorno" titulo={e.nome} onPress={() => setEmp(e)} />)}
          </View>
        )
      ) : (
        <Campo rotulo="Local" value={local} onChangeText={setLocal} placeholder="Ex.: sala 2 do escritório" />
      )}
      <SeletorDataHora rotulo="Quando" valor={quando} aoMudar={setQuando} minimo={new Date()} />
      <Campo rotulo="Observações (opcional)" value={obs} onChangeText={setObs} multiline />
      {atual && (
        <View style={{ gap: 8 }}>
          <Text style={s.rotulo}>Status</Text>
          <View style={[s.linha, { flexWrap: "wrap" }]}>
            {Object.entries(STATUS).map(([k, v]) => <Chip key={k} texto={v.rotulo} ativo={status === k} onPress={() => setStatus(k)} />)}
          </View>
          {status === "cancelado" && atual.status !== "cancelado" && <Campo rotulo="Motivo do cancelamento" value={motivo} onChangeText={setMotivo} />}
        </View>
      )}
      <Erro texto={erro} />
      <View style={s.linha}>
        <Botao titulo="Cancelar" tipo="contorno" onPress={aoFechar} estilo={{ flex: 1 }} />
        <Botao titulo="Salvar" icone="checkmark" onPress={salvar} carregando={criar.isPending || alterar.isPending} estilo={{ flex: 1 }} />
      </View>
    </Cartao>
  );
}

export default function ClienteDetalheTela() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const cliente = useCliente(id);
  const agendamentos = useAgendamentosDoCliente(id);
  const excluirCliente = useExcluirCliente();
  const excluirAgendamento = useExcluirAgendamentoDoCliente(id);
  const [formulario, setFormulario] = useState(null); // null | "novo" | agendamento em edição

  useEffect(() => { if (cliente.data?.nome) navigation.setOptions({ title: cliente.data.nome }); }, [cliente.data?.nome, navigation]);

  function confirmarExclusao() {
    Alert.alert("Excluir cliente?", "O cliente sai da sua carteira. Cliente com venda ou agendamento não pode ser excluído.", [
      { text: "Voltar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        try { await excluirCliente.mutateAsync(id); router.back(); }
        catch (e) { Alert.alert("Não deu para excluir", e.message); }
      } },
    ]);
  }

  function confirmarExclusaoAgendamento(ag) {
    Alert.alert("Excluir agendamento?", `${dia(ag.dataHora)} às ${hora(ag.dataHora)}`, [
      { text: "Voltar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => excluirAgendamento.mutateAsync(ag.id).catch((e) => Alert.alert("Não deu para excluir", e.message)) },
    ]);
  }

  if (cliente.isLoading) return <Carregando />;
  if (!cliente.data) return <View style={[s.tela, s.vazio]}><Erro texto={cliente.error?.message ?? "Cliente não encontrado."} /></View>;
  const c = cliente.data;
  const lista = agendamentos.data ?? [];

  return (
    <ScrollView style={s.tela} contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
      <Card mode="outlined" style={{ backgroundColor: cores.cartao, borderColor: cores.linha, borderRadius: raio.grande }}>
        <Card.Title title={c.nome} titleStyle={{ color: cores.texto, fontWeight: "700" }}
          subtitle={c.leadOrigem ? `Veio do lead ${c.leadOrigem.nome}` : "Cadastrado na carteira"} subtitleStyle={{ color: cores.texto3 }}
          right={() => (
            <View style={s.linha}>
              <IconButton icon={iconeIonicons("create-outline")} iconColor={cores.dourado} accessibilityLabel="Editar cliente"
                onPress={() => router.push({ pathname: "/cliente/editar/[id]", params: { id: String(id) } })} />
              <IconButton icon={iconeIonicons("trash-outline")} iconColor={cores.perigo} accessibilityLabel="Excluir cliente" onPress={confirmarExclusao} />
            </View>
          )} />
        <Card.Content style={{ gap: 6 }}>
          <Text style={[s.texto, { fontSize: 18 }]}>{formatarTelefone(c.telefone)}</Text>
          {c.email ? <Text style={s.texto2}>{c.email}</Text> : null}
          {c.observacoes ? <Text style={s.texto2}>{c.observacoes}</Text> : null}
          <View style={[s.linha, { marginTop: 6 }]}>
            <Botao titulo="Ligar" icone="call" onPress={() => Linking.openURL(linkLigar(c.telefone))} estilo={{ flex: 1 }} />
            <Botao titulo="WhatsApp" tipo="whatsapp" icone="logo-whatsapp" onPress={() => Linking.openURL(linkWhatsApp(c.telefone))} estilo={{ flex: 1 }} />
          </View>
        </Card.Content>
      </Card>

      <Divider style={{ backgroundColor: cores.linha }} />
      <View style={[s.linha, { justifyContent: "space-between" }]}>
        <Text style={[s.texto, { fontWeight: "700" }]}>Agendamentos ({lista.length})</Text>
        {!formulario && <Botao titulo="Agendar" icone="add" onPress={() => setFormulario("novo")} />}
      </View>
      {formulario && (
        <FormAgendamento key={formulario === "novo" ? "novo" : formulario.id} clienteId={id}
          atual={formulario === "novo" ? null : formulario} aoFechar={() => setFormulario(null)} />
      )}
      <Erro texto={agendamentos.error?.message} />
      {lista.length === 0 && !agendamentos.isLoading && <Vazio titulo="Nenhum agendamento" texto="Toque em Agendar para marcar uma visita ou reunião." icone="calendar-outline" />}
      {lista.map((ag) => {
        const st = STATUS[ag.status] ?? STATUS.agendado;
        return (
          <Cartao key={ag.id}>
            <View style={[s.linha, { justifyContent: "space-between" }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.texto, { fontWeight: "700" }]}>{dia(ag.dataHora)} · {hora(ag.dataHora)}</Text>
                <Text style={s.texto2}>{ag.tipo === "visita_imovel" ? `Visita: ${ag.empreendimento?.nome ?? "imóvel"}` : `Reunião${ag.local ? `: ${ag.local}` : ""}`}</Text>
              </View>
              <Selo texto={st.rotulo} cor={st.cor} />
            </View>
            {ag.observacoes ? <Text style={s.texto3}>{ag.observacoes}</Text> : null}
            <View style={s.linha}>
              <Botao titulo="Alterar" tipo="contorno" icone="create-outline" onPress={() => setFormulario(ag)} estilo={{ flex: 1 }} />
              {ag.status !== "realizado" && <Botao titulo="Excluir" tipo="perigo" icone="trash-outline" onPress={() => confirmarExclusaoAgendamento(ag)} estilo={{ flex: 1 }} />}
            </View>
          </Cartao>
        );
      })}
    </ScrollView>
  );
}
