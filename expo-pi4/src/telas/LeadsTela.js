// Meus leads (João): ligar, WhatsApp, copiar o número segurando, lembrete com alarme.
// Regra da Place: quem retorna primeiro leva o cliente. Lead novo fica no topo com o tempo de espera.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Linking, Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Botao, Campo, Carregando, Cartao, Chip, Erro, Selo, Vazio, s } from "../componentes/ui";
import { meusLeads, minhaRoleta, mudarStatusLead, registrarAtividade } from "../api/servicos";
import { formatarTelefone, linkLigar, linkWhatsApp, saudacao } from "../lib/telefone";
import { dia, hora, tempoDesde } from "../lib/datas";
import { assuntoDoContato, detalheDoPedido, tipoDoLead } from "../lib/leads";
import { agendarLembrete } from "../notificacoes/push";
import { cores } from "../tema";

const STATUS = {
  novo: { rotulo: "Novo", cor: cores.info },
  em_atendimento: { rotulo: "Em atendimento", cor: cores.dourado },
  convertido: { rotulo: "Convertido", cor: cores.ok },
  perdido: { rotulo: "Perdido", cor: cores.perigo },
};
// Leads de captação e de busca por pronto/usado vêm do site sem empreendimento.
const TIPOS = {
  captacao: { rotulo: "Captação", cor: cores.ok, titulo: "Quer vender o imóvel", dica: "Ligue e combine a avaliação do imóvel." },
  pronto_usado: { rotulo: "Pronto ou usado", cor: cores.dourado, titulo: "Procura pronto ou usado", dica: "Busque nos parceiros e volte com opções." },
};

const FILTROS = [["ativos", "Ativos"], ["novo", "Novos"], ["em_atendimento", "Em atendimento"], ["convertido", "Convertidos"], ["perdido", "Perdidos"]];

function Lembrete({ lead, onFechar }) {
  const [quando, setQuando] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const [modo, setModo] = useState(null);
  const [nota, setNota] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (quando <= new Date()) return setErro("Escolha um horário daqui pra frente.");
    setSalvando(true);
    try {
      // Fica registrado no lead (aparece no site também) e toca o alarme no celular.
      await registrarAtividade(lead.id, { tipo: "observacao", descricao: nota.trim() || "Pediu para retornar em outro horário.", proximoContatoEm: quando.toISOString() });
      await agendarLembrete({ quando, nome: lead.nome, nota: nota.trim(), leadId: lead.id });
      onFechar(true);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={() => onFechar(false)}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View style={[s.cartao, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: 28 }]}>
          <Text style={[s.texto, { fontWeight: "700", fontSize: 17 }]}>Lembrar de retornar para {lead.nome.split(" ")[0]}</Text>
          <View style={s.linha}>
            <Botao tipo="contorno" icone="calendar-outline" titulo={dia(quando)} onPress={() => setModo("date")} estilo={{ flex: 1 }} />
            <Botao tipo="contorno" icone="time-outline" titulo={hora(quando)} onPress={() => setModo("time")} estilo={{ flex: 1 }} />
          </View>
          {modo && (
            <DateTimePicker value={quando} mode={modo} is24Hour minimumDate={new Date()}
              onChange={(ev, d) => { setModo(null); if (d) setQuando((a) => { const n = new Date(a); if (modo === "date") n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); else n.setHours(d.getHours(), d.getMinutes()); return n; }); }} />
          )}
          <Campo rotulo="Anotação (opcional)" value={nota} onChangeText={setNota} placeholder="Ex.: prefere depois do almoço" />
          <Erro texto={erro} />
          <Botao titulo="Salvar lembrete" icone="alarm-outline" onPress={salvar} carregando={salvando} />
          <Botao titulo="Cancelar" tipo="contorno" onPress={() => onFechar(false)} />
        </View>
      </View>
    </Modal>
  );
}

function CartaoLead({ lead, onAtualizar }) {
  const [copiado, setCopiado] = useState(false);
  const [lembrete, setLembrete] = useState(false);
  const st = STATUS[lead.status] ?? STATUS.novo;
  const chegou = lead.atribuidoEm ?? lead.criadoEm;
  const tipo = TIPOS[tipoDoLead(lead.mensagem)] ?? null;
  const detalhe = tipo ? detalheDoPedido(lead.mensagem) : "";

  async function contato(tipo) {
    // Registra o contato e tira o lead de "novo" (o gerente vê o tempo de resposta).
    registrarAtividade(lead.id, { tipo, descricao: tipo === "ligacao" ? "Ligou para o cliente pelo app." : "Abriu a conversa no WhatsApp pelo app." }).catch(() => {});
    if (lead.status === "novo") mudarStatusLead(lead.id, "em_atendimento").then(onAtualizar).catch(() => {});
    const primeiro = lead.nome.split(" ")[0];
    await Linking.openURL(tipo === "ligacao" ? linkLigar(lead.telefone) : linkWhatsApp(lead.telefone, `${saudacao()}, ${primeiro}! Aqui é da Place Brokers, ${assuntoDoContato(lead)}.`));
  }

  async function copiar() {
    await Clipboard.setStringAsync(formatarTelefone(lead.telefone));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function mudarStatus() {
    Alert.alert("Mudar status", lead.nome, [
      ...Object.entries(STATUS).filter(([k]) => k !== lead.status).map(([k, v]) => ({ text: v.rotulo, onPress: () => mudarStatusLead(lead.id, k).then(onAtualizar).catch((e) => Alert.alert("Não deu", e.message)) })),
      { text: "Voltar", style: "cancel" },
    ]);
  }

  return (
    <Cartao>
      <View style={[s.linha, { justifyContent: "space-between" }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.texto, { fontWeight: "700" }]} numberOfLines={1}>{lead.nome}</Text>
          <Text style={s.texto3} numberOfLines={1}>{lead.empreendimento?.nome ?? tipo?.titulo ?? "Sem empreendimento"} · {dia(chegou)}</Text>
        </View>
        <Pressable onPress={mudarStatus} accessibilityRole="button" accessibilityLabel={`Status: ${st.rotulo}. Tocar para mudar`} hitSlop={10}>
          <Selo texto={st.rotulo} cor={st.cor} />
        </Pressable>
      </View>
      {tipo && (
        <View style={{ gap: 4, borderLeftWidth: 3, borderLeftColor: tipo.cor, paddingLeft: 10 }}>
          <Selo texto={tipo.rotulo} cor={tipo.cor} />
          {detalhe ? <Text style={s.texto2}>{detalhe}</Text> : null}
          <Text style={s.texto3}>{tipo.dica}</Text>
        </View>
      )}
      {lead.status === "novo" && <Text style={{ color: cores.perigo, fontWeight: "600" }}>Aguardando retorno {tempoDesde(chegou)}</Text>}
      <Pressable onLongPress={copiar} delayLongPress={350} accessibilityHint="Segure para copiar o número"
        style={{ backgroundColor: cores.cartao2, borderRadius: 12, padding: 12 }}>
        <Text style={{ color: cores.texto, fontSize: 18, letterSpacing: 1, fontVariant: ["tabular-nums"] }}>{formatarTelefone(lead.telefone)}</Text>
        <Text style={s.texto3}>{copiado ? "Número copiado" : "Segure para copiar"}</Text>
      </Pressable>
      {lead.mensagem ? <Text style={s.texto2} numberOfLines={3}>{lead.mensagem}</Text> : null}
      <View style={s.linha}>
        <Botao titulo="Ligar" icone="call" onPress={() => contato("ligacao")} estilo={{ flex: 1 }} />
        <Botao titulo="WhatsApp" tipo="whatsapp" icone="logo-whatsapp" onPress={() => contato("whatsapp")} estilo={{ flex: 1 }} />
      </View>
      <Botao titulo="Lembrar de retornar" tipo="contorno" icone="alarm-outline" onPress={() => setLembrete(true)} />
      {lembrete && <Lembrete lead={lead} onFechar={(salvou) => { setLembrete(false); if (salvou) Alert.alert("Lembrete salvo", "O celular vai tocar na hora marcada."); }} />}
    </Cartao>
  );
}

export default function LeadsTela() {
  const [leads, setLeads] = useState(null);
  const [roleta, setRoleta] = useState(null);
  const [filtro, setFiltro] = useState("ativos");
  const [erro, setErro] = useState("");
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setErro("");
      const [l, r] = await Promise.all([meusLeads(), minhaRoleta().catch(() => null)]);
      setLeads(l);
      setRoleta(r);
    } catch (e) {
      setErro(e.message);
      setLeads((x) => x ?? []);
    }
  }, []);

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 60 * 1000); // confere lead novo a cada minuto com o app aberto
    return () => clearInterval(t);
  }, [carregar]);

  const lista = useMemo(() => {
    const base = (leads ?? []).filter((l) => (filtro === "ativos" ? ["novo", "em_atendimento"].includes(l.status) : l.status === filtro));
    // Novos primeiro (o mais antigo esperando no topo); depois os mais recentes.
    return base.sort((a, b) => (a.status === "novo") !== (b.status === "novo") ? (a.status === "novo" ? -1 : 1)
      : a.status === "novo" ? new Date(a.atribuidoEm ?? a.criadoEm) - new Date(b.atribuidoEm ?? b.criadoEm)
        : new Date(b.criadoEm) - new Date(a.criadoEm));
  }, [leads, filtro]);

  if (leads === null) return <Carregando />;
  const novos = leads.filter((l) => l.status === "novo").length;

  return (
    <FlatList
      style={s.tela}
      contentContainerStyle={s.conteudo}
      data={lista}
      keyExtractor={(l) => String(l.id)}
      refreshControl={<RefreshControl refreshing={atualizando} tintColor={cores.dourado} onRefresh={async () => { setAtualizando(true); await carregar(); setAtualizando(false); }} />}
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          {roleta?.chegada && (
            <Cartao estilo={{ padding: 12 }}>
              <Text style={s.texto2}>
                Roleta de hoje: você é o <Text style={{ color: cores.dourado, fontWeight: "700" }}>nº {roleta.chegada.ordem}</Text>
                {roleta.chegada.apto ? ` · ${roleta.recebidosHoje ?? 0} lead(s) recebido(s)` : " · chegou depois das 09h, não recebe hoje"}
              </Text>
            </Cartao>
          )}
          {novos > 0 && <Text style={{ color: cores.perigo, fontWeight: "700" }}>{novos} lead{novos > 1 ? "s" : ""} esperando o seu retorno</Text>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {FILTROS.map(([k, v]) => <Chip key={k} texto={v} ativo={filtro === k} onPress={() => setFiltro(k)} />)}
          </ScrollView>
          <Erro texto={erro} />
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => <CartaoLead lead={item} onAtualizar={carregar} />}
      ListEmptyComponent={<Vazio titulo={filtro === "ativos" ? "Nenhum lead em aberto" : "Nada aqui"} texto="Quando a roleta mandar um lead para você, ele aparece aqui e o celular avisa." icone="people-outline" />}
    />
  );
}