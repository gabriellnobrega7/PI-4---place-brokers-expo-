// Agenda (Sérgio): visitas e reuniões do corretor — listar, agendar, remarcar e mudar status.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Linking, Pressable, RefreshControl, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Botao, Campo, Carregando, Cartao, Chip, Erro, Selo, Vazio, s } from "../componentes/ui";
import { listarAgendamentos, mudarStatusAgendamento, remarcar } from "../api/servicos";
import { dia, hora, separarAgenda } from "../lib/datas";
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
  const [remarcando, setRemarcando] = useState(null); // "date" | "time"
  const [novaData, setNovaData] = useState(() => new Date(ag.dataHora));
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const st = STATUS[ag.status] ?? STATUS.agendado;
  const encerrado = ["realizado", "nao_compareceu", "cancelado"].includes(ag.status);
  const onde = ag.tipo === "visita_imovel" ? ag.empreendimento?.nome ?? "Imóvel" : ag.local ?? "Escritório";

  async function acao(fn) {
    setOcupado(true);
    setErro("");
    try { await fn(); onMudou(); } catch (e) { setErro(e.message); } finally { setOcupado(false); }
  }

  return (
    <Cartao>
      <Pressable style={[s.linha, { justifyContent: "space-between", minHeight: 48 }]} onPress={() => setAberto((v) => !v)}
        accessibilityRole="button" accessibilityState={{ expanded: aberto }} accessibilityLabel={`${hora(ag.dataHora)}, ${ag.cliente?.nome ?? "Cliente"}`}>
        <Text style={{ color: cores.dourado, fontSize: 20, fontWeight: "700", width: 64 }}>{hora(ag.dataHora)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.texto, { fontWeight: "700" }]} numberOfLines={1}>{ag.cliente?.nome ?? "Cliente"}</Text>
          <Text style={s.texto3} numberOfLines={1}>{ag.tipo === "visita_imovel" ? "Visita" : "Reunião"} · {onde}</Text>
        </View>
        <Selo texto={st.rotulo} cor={st.cor} />
      </Pressable>
      {aberto && (
        <View style={{ gap: 8 }}>
          {ag.observacoes ? <Text style={s.texto2}>{ag.observacoes}</Text> : null}
          {ag.cliente?.telefone ? (
            <View style={s.linha}>
              <Botao titulo="Ligar" icone="call" onPress={() => Linking.openURL(linkLigar(ag.cliente.telefone))} estilo={{ flex: 1 }} />
              <Botao titulo="WhatsApp" tipo="whatsapp" icone="logo-whatsapp" estilo={{ flex: 1 }}
                onPress={() => Linking.openURL(linkWhatsApp(ag.cliente.telefone, `${saudacao()}, ${ag.cliente.nome.split(" ")[0]}! Confirmando nossa ${ag.tipo === "visita_imovel" ? "visita" : "reunião"} ${dia(ag.dataHora).toLowerCase()} às ${hora(ag.dataHora)}.`))} />
            </View>
          ) : null}
          {!encerrado && (
            <>
              <View style={[s.linha, { flexWrap: "wrap" }]}>
                {ag.status === "agendado" && <Botao titulo="Confirmar" tipo="contorno" desativado={ocupado} onPress={() => acao(() => mudarStatusAgendamento(ag.id, "confirmado"))} />}
                {new Date(ag.dataHora) <= new Date() && (
                  <>
                    <Botao titulo="Realizado" tipo="contorno" desativado={ocupado} onPress={() => acao(() => mudarStatusAgendamento(ag.id, "realizado"))} />
                    <Botao titulo="Não compareceu" tipo="contorno" desativado={ocupado} onPress={() => acao(() => mudarStatusAgendamento(ag.id, "nao_compareceu"))} />
                  </>
                )}
                <Botao titulo="Remarcar" tipo="contorno" desativado={ocupado} onPress={() => setRemarcando("date")} />
                <Botao titulo="Cancelar" tipo="perigo" desativado={ocupado} onPress={() => setCancelando((v) => !v)} />
              </View>
              {remarcando && (
                <DateTimePicker value={novaData} mode={remarcando} is24Hour minimumDate={new Date()}
                  onChange={(ev, d) => {
                    if (ev.type === "dismissed" || !d) return setRemarcando(null);
                    const n = new Date(novaData);
                    if (remarcando === "date") { n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); setNovaData(n); setRemarcando("time"); return; }
                    n.setHours(d.getHours(), d.getMinutes(), 0, 0);
                    setNovaData(n);
                    setRemarcando(null);
                    Alert.alert("Remarcar", `Passar para ${dia(n).toLowerCase()} às ${hora(n)}?`, [
                      { text: "Voltar", style: "cancel" },
                      { text: "Remarcar", onPress: () => acao(() => remarcar(ag.id, n.toISOString())) },
                    ]);
                  }} />
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
    try { setErro(""); setLista(await listarAgendamentos()); } catch (e) { setErro(e.message); setLista((l) => l ?? []); }
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
          <View style={s.linha}>
            <Chip texto={`Hoje (${grupos.hoje.length})`} ativo={aba === "hoje"} onPress={() => setAba("hoje")} />
            <Chip texto={`Próximos (${grupos.proximos.length})`} ativo={aba === "proximos"} onPress={() => setAba("proximos")} />
            <Chip texto="Histórico" ativo={aba === "historico"} onPress={() => setAba("historico")} />
          </View>
          <Erro texto={erro} />
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item, index }) => (
        <View style={{ gap: 6 }}>
          {aba !== "hoje" && (index === 0 || dia(itens[index - 1].dataHora) !== dia(item.dataHora)) && <Text style={s.rotulo}>{dia(item.dataHora)}</Text>}
          <ItemAgenda ag={item} onMudou={carregar} />
        </View>
      )}
      ListEmptyComponent={<Vazio titulo={aba === "hoje" ? "Nada marcado para hoje" : "Nada por aqui"} texto="Toque em Novo agendamento para marcar uma visita ou reunião." icone="calendar-outline" />}
    />
  );
}