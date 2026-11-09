// Novo agendamento (Sérgio): cliente da carteira, visita ou reunião, data e hora.
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Botao, Campo, Chip, Erro, s } from "../componentes/ui";
import { criarAgendamento, listarClientes, listarEmpreendimentos } from "../api/servicos";
import { dia, hora } from "../lib/datas";
import { cores } from "../tema";

const sem = (t = "") => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function NovoAgendamentoTela({ navigation }) {
  const [clientes, setClientes] = useState([]);
  const [empreendimentos, setEmpreendimentos] = useState([]);
  const [tipo, setTipo] = useState("visita_imovel");
  const [cliente, setCliente] = useState(null);
  const [emp, setEmp] = useState(null);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [buscaEmp, setBuscaEmp] = useState("");
  const [quando, setQuando] = useState(() => { const d = new Date(Date.now() + 24 * 3600 * 1000); d.setHours(10, 0, 0, 0); return d; });
  const [modo, setModo] = useState(null);
  const [local, setLocal] = useState("");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarClientes().then(setClientes).catch((e) => setErro(e.message));
    listarEmpreendimentos().then((d) => setEmpreendimentos(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const clientesFiltrados = useMemo(() => clientes.filter((c) => !buscaCliente || sem(c.nome).includes(sem(buscaCliente))).slice(0, 6), [clientes, buscaCliente]);
  const empsFiltrados = useMemo(() => empreendimentos.filter((e) => !buscaEmp || sem(`${e.nome} ${e.bairro ?? ""}`).includes(sem(buscaEmp))).slice(0, 6), [empreendimentos, buscaEmp]);

  async function salvar() {
    if (!cliente) return setErro("Escolha o cliente. Lead novo vira cliente pelo site em Meus leads → Agendar visita.");
    if (tipo === "visita_imovel" && !emp) return setErro("Escolha o empreendimento da visita.");
    if (quando <= new Date()) return setErro("Escolha um horário daqui pra frente.");
    setSalvando(true);
    setErro("");
    try {
      await criarAgendamento({
        tipo, clienteId: cliente.id, dataHora: quando.toISOString(),
        empreendimentoId: tipo === "visita_imovel" ? emp.id : undefined,
        local: tipo === "visita_imovel" ? undefined : local.trim() || undefined,
        observacoes: obs.trim() || undefined,
      });
      navigation.goBack();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView style={s.tela} contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
      <View style={s.linha}>
        <Chip texto="Visita ao imóvel" ativo={tipo === "visita_imovel"} onPress={() => setTipo("visita_imovel")} />
        <Chip texto="Reunião no escritório" ativo={tipo === "reuniao_escritorio"} onPress={() => setTipo("reuniao_escritorio")} />
      </View>

      <Text style={s.rotulo}>Cliente</Text>
      {cliente ? <Botao tipo="contorno" titulo={`${cliente.nome} (trocar)`} onPress={() => setCliente(null)} /> : (
        <>
          <Campo value={buscaCliente} onChangeText={setBuscaCliente} placeholder="Buscar na sua carteira" />
          {clientesFiltrados.map((c) => <Botao key={c.id} tipo="contorno" titulo={c.nome} onPress={() => setCliente(c)} />)}
          {clientes.length === 0 && <Text style={s.texto3}>Sua carteira está vazia.</Text>}
        </>
      )}

      {tipo === "visita_imovel" ? (
        <>
          <Text style={s.rotulo}>Empreendimento</Text>
          {emp ? <Botao tipo="contorno" titulo={`${emp.nome} (trocar)`} onPress={() => setEmp(null)} /> : (
            <>
              <Campo value={buscaEmp} onChangeText={setBuscaEmp} placeholder="Buscar empreendimento" />
              {empsFiltrados.map((e) => <Botao key={e.id} tipo="contorno" titulo={e.nome} onPress={() => setEmp(e)} />)}
            </>
          )}
        </>
      ) : (
        <Campo rotulo="Local" value={local} onChangeText={setLocal} placeholder="Ex.: sala 2 do escritório" />
      )}

      <Text style={s.rotulo}>Quando</Text>
      <View style={s.linha}>
        <Botao tipo="contorno" icone="calendar-outline" titulo={dia(quando)} onPress={() => setModo("date")} estilo={{ flex: 1 }} />
        <Botao tipo="contorno" icone="time-outline" titulo={hora(quando)} onPress={() => setModo("time")} estilo={{ flex: 1 }} />
      </View>
      {modo && (
        <DateTimePicker value={quando} mode={modo} is24Hour minimumDate={new Date()}
          onChange={(ev, d) => { setModo(null); if (d) setQuando((a) => { const n = new Date(a); if (modo === "date") n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); else n.setHours(d.getHours(), d.getMinutes(), 0, 0); return n; }); }} />
      )}

      <Campo rotulo="Observações (opcional)" value={obs} onChangeText={setObs} multiline placeholder="Ex.: levar simulação de crédito" />
      <Erro texto={erro} />
      <Botao titulo="Agendar" icone="checkmark" onPress={salvar} carregando={salvando} />
      <Text style={[s.texto3, { color: cores.texto3 }]}>O cliente aparece na agenda do site também.</Text>
    </ScrollView>
  );
}