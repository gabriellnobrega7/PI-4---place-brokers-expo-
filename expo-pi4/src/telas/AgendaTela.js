// Agenda (Sérgio): visitas e reuniões do corretor — listar, agendar, remarcar e mudar status.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Linking, Platform, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Botao, Campo, Carregando, Cartao, Chip, Erro, Selo, Vazio, s } from "../componentes/ui";
import { listarAgendamentos, mudarStatusAgendamento, remarcar } from "../api/servicos";
import { chaveDia, combinarDataHora, dataFutura, dia, hora, podeFinalizar, separarAgenda, statusEncerrado } from "../lib/datas";
import { linkLigar, linkWhatsApp, saudacao } from "../lib/telefone";
import { cores } from "../tema";

const STATUS = {
  agendado: { rotulo: "Agendado", cor: cores.texto3 },
  confirmado: { rotulo: "Confirmado", cor: cores.info },
  realizado: { rotulo: "Realizado", cor: cores.ok },
  nao_compareceu: { rotulo: "Não compareceu", cor: cores.dourado },
  cancelado: { rotulo: "Cancelado", cor: cores.perigo },
};

function ItemAgenda({ ag, onMudou }) {
  const [aberto, setAberto] = useState(false);
  const [remarcando, setRemarcando] = useState(false);
  const [modo, setModo] = useState(null);
  const [novaData, setNovaData] = useState(() => new Date(ag.dataHora));
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const st = STATUS[ag.status] ?? STATUS.agendado;
  const encerrado = statusEncerrado(ag.status);
  const podeConcluir = podeFinalizar(ag.dataHora);
  const onde = ag.tipo === "visita_imovel" ? ag.empreendimento?.nome ?? "Imóvel" : ag.local ?? "Escritório";

  async function acao(fn) {
    if (ocupado) return;
    setOcupado(true);
    setErro("");
    try {
      await fn();
      setRemarcando(false);
      setCancelando(false);
      setModo(null);
      await onMudou();
    } catch (e) {
      setErro(e?.message ?? "Não foi possível atualizar o agendamento.");
    } finally {
      setOcupado(false);
    }
  }

  function confirmarStatus(status, titulo, mensagem) {
    Alert.alert(titulo, mensagem, [
      { text: "Voltar", style: "cancel" },
      { text: "Confirmar", onPress: () => acao(() => mudarStatusAgendamento(ag.id, status)) },
    ]);
  }

  function abrirRemarcacao() {
    setCancelando(false);
    setRemarcando(true);
    setNovaData(new Date(ag.dataHora));
    setModo(null);
    setErro("");
  }

  async function abrirContato(url) {
    try { await Linking.openURL(url); }
    catch { setErro("Não foi possível abrir o aplicativo de contato."); }
  }
  const nomeCliente = ag.cliente?.nome?.trim() || "Cliente";
  const primeiroNome = nomeCliente.split(/\s+/)[0];

  return (
    <Cartao>
      <Pressable style={[s.linha, { justifyContent: "space-between", minHeight: 48 }]} onPress={() => setAberto((v) => !v)}
        accessibilityRole="button" accessibilityState={{ expanded: aberto }} accessibilityLabel={`${hora(ag.dataHora)}, ${nomeCliente}, ${st.rotulo}`}>
        <Text style={{ color: cores.dourado, fontSize: 20, fontWeight: "700", width: 64 }}>{hora(ag.dataHora)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.texto, { fontWeight: "700" }]} numberOfLines={1}>{nomeCliente}</Text>
          <Text style={s.texto3} numberOfLines={1}>{ag.tipo === "visita_imovel" ? "Visita" : "Reunião"} · {onde}</Text>
        </View>
        <Selo texto={st.rotulo} cor={st.cor} />
      </Pressable>
      {aberto && (
        <View style={{ gap: 8 }}>
          {ag.observacoes ? <Text style={s.texto2}>{ag.observacoes}</Text> : null}
          {ag.cliente?.telefone ? (
            <View style={s.linha}>
              <Botao titulo="Ligar" icone="call" onPress={() => abrirContato(linkLigar(ag.cliente.telefone))} estilo={{ flex: 1 }} />
              <Botao titulo="WhatsApp" tipo="whatsapp" icone="logo-whatsapp" estilo={{ flex: 1 }}
                onPress={() => abrirContato(linkWhatsApp(ag.cliente.telefone, `${saudacao()}, ${primeiroNome}! Confirmando nossa ${ag.tipo === "visita_imovel" ? "visita" : "reunião"} ${dia(ag.dataHora).toLowerCase()} às ${hora(ag.dataHora)}.`))} />
            </View>
          ) : null}
          {!encerrado && (
            <>
              <View style={[s.linha, { flexWrap: "wrap" }]}>
                {ag.status === "agendado" && <Botao titulo="Confirmar" tipo="contorno" desativado={ocupado} onPress={() => acao(() => mudarStatusAgendamento(ag.id, "confirmado"))} />}
                {podeConcluir && (
                  <>
                    <Botao titulo="Realizado" tipo="contorno" desativado={ocupado} onPress={() => confirmarStatus("realizado", "Marcar como realizado?", "Confirma que a visita ou reunião aconteceu?")} />
                    <Botao titulo="Não compareceu" tipo="contorno" desativado={ocupado} onPress={() => confirmarStatus("nao_compareceu", "Registrar ausência?", "Confirma que o cliente não compareceu?")} />
                  </>
                )}
                <Botao titulo="Remarcar" tipo="contorno" desativado={ocupado} onPress={abrirRemarcacao} />
                <Botao titulo="Cancelar" tipo="perigo" desativado={ocupado} onPress={() => { setRemarcando(false); setModo(null); setCancelando((v) => !v); }} />
              </View>
              {remarcando && (
                <View style={{ gap: 8 }}>
                  <Text style={s.rotulo}>Nova data e horário</Text>
                  <View style={s.linha}>
                    <Botao tipo="contorno" icone="calendar-outline" titulo={dia(novaData)} desativado={ocupado} estilo={{ flex: 1 }} onPress={() => setModo("date")} />
                    <Botao tipo="contorno" icone="time-outline" titulo={hora(novaData)} desativado={ocupado} estilo={{ flex: 1 }} onPress={() => setModo("time")} />
                  </View>
                  {modo && (
                    <View style={{ gap: 8 }}>
                      <DateTimePicker
                        key={modo}
                        value={novaData}
                        mode={modo}
                        is24Hour
                        minimumDate={modo === "date" ? new Date() : undefined}
                        onChange={(evento, escolhido) => {
                          if (Platform.OS !== "ios") setModo(null);
                          if (evento.type !== "dismissed" && escolhido) {
                            setNovaData((atual) => combinarDataHora(atual, escolhido, modo));
                          }
                        }}
                      />
                      {Platform.OS === "ios" && <Botao titulo="Concluir seleção" tipo="contorno" onPress={() => setModo(null)} />}
                    </View>
                  )}
                  {!dataFutura(novaData) && <Erro texto="Escolha uma data e hora futuras para remarcar." />}
                  <View style={s.linha}>
                    <Botao
                      titulo="Salvar nova data" icone="checkmark" estilo={{ flex: 1 }}
                      desativado={ocupado || !dataFutura(novaData) || novaData.getTime() === new Date(ag.dataHora).getTime()}
                      carregando={ocupado}
                      onPress={() => acao(() => remarcar(ag.id, novaData.toISOString()))}
                    />
                    <Botao titulo="Voltar" tipo="contorno" desativado={ocupado} onPress={() => { setRemarcando(false); setModo(null); }} />
                  </View>
                </View>
              )}
              {cancelando && (
                <View style={{ gap: 8 }}>
                  <Campo rotulo="Motivo do cancelamento" value={motivo} onChangeText={setMotivo} placeholder="Ex.: cliente pediu para remarcar no mês que vem" />
                  <Botao titulo="Confirmar cancelamento" tipo="perigo" desativado={!motivo.trim() || ocupado}
                    onPress={() => acao(() => mudarStatusAgendamento(ag.id, "cancelado", { motivoCancelamento: motivo.trim() }))} />
                </View>
              )}
            </>
          )}
          <Erro texto={erro} />
        </View>
      )}
    </Cartao>
  );
}

export default function AgendaTela({ navigation }) {
  const [lista, setLista] = useState(null);
  const [aba, setAba] = useState("hoje");
  const [erro, setErro] = useState("");
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setErro("");
      const dados = await listarAgendamentos();
      setLista(Array.isArray(dados) ? dados : []);
    } catch (e) {
      setErro(e?.message ?? "Não foi possível carregar a agenda.");
      setLista((anterior) => anterior ?? []);
    }
  }, []);

  useEffect(() => navigation.addListener("focus", carregar), [navigation, carregar]);

  const grupos = useMemo(() => separarAgenda(lista ?? []), [lista]);
  if (lista === null) return <Carregando />;
  const itens = grupos[aba];

  return (
    <FlatList
      style={s.tela}
      contentContainerStyle={s.conteudo}
      data={itens}
      keyExtractor={(a) => String(a.id)}
      refreshControl={<RefreshControl refreshing={atualizando} tintColor={cores.dourado} onRefresh={async () => { setAtualizando(true); await carregar(); setAtualizando(false); }} />}
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          <Botao titulo="Novo agendamento" icone="add" onPress={() => navigation.navigate("NovoAgendamento")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Chip texto={`Hoje (${grupos.hoje.length})`} ativo={aba === "hoje"} onPress={() => setAba("hoje")} />
            <Chip texto={`Próximos (${grupos.proximos.length})`} ativo={aba === "proximos"} onPress={() => setAba("proximos")} />
            <Chip texto={`Histórico (${grupos.historico.length})`} ativo={aba === "historico"} onPress={() => setAba("historico")} />
          </ScrollView>
          <Erro texto={erro} />
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item, index }) => (
        <View style={{ gap: 6 }}>
          {aba !== "hoje" && (index === 0 || chaveDia(itens[index - 1].dataHora) !== chaveDia(item.dataHora)) && <Text style={s.rotulo}>{dia(item.dataHora)}</Text>}
          <ItemAgenda ag={item} onMudou={carregar} />
        </View>
      )}
      ListEmptyComponent={<Vazio titulo={aba === "hoje" ? "Nada marcado para hoje" : "Nada por aqui"} texto="Toque em Novo agendamento para marcar uma visita ou reunião." icone="calendar-outline" />}
    />
  );
}