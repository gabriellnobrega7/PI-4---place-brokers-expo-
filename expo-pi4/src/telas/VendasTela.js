// Vendas (Sofia): o corretor lança a venda de um cliente da carteira, corrige ou exclui enquanto
// o gerente não decide. Confirmada conta no VGV e não muda mais.
import { useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { useAtualizarVenda, useClientes, useCriarVenda, useEmpreendimentos, useExcluirVenda, useVendas, useVgv } from "../api/consultas";
import { Botao, Campo, Carregando, Cartao, Erro, Selo, Vazio, s } from "../componentes/ui";
import SeletorDataHora from "../componentes/SeletorDataHora";
import { dia } from "../lib/datas";
import { brl } from "../lib/preco";
import { cores, raio } from "../tema";

const STATUS = { pendente: ["Aguardando gerente", cores.info], confirmada: ["Confirmada", cores.ok], recusada: ["Recusada", cores.perigo] };
const sem = (t = "") => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const isoDoDia = (d) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
const deIso = (t) => { const [a, m, d] = String(t).split("-").map(Number); return new Date(a, m - 1, d, 12); };

function Escolha({ rotulo, lista, escolhido, aoEscolher, textoBusca }) {
  const [busca, setBusca] = useState("");
  const opcoes = useMemo(() => (lista ?? []).filter((x) => busca && sem(textoBusca(x)).includes(sem(busca))).slice(0, 5), [lista, busca, textoBusca]);
  if (escolhido) return <Botao tipo="contorno" titulo={`${escolhido.nome} (trocar)`} onPress={() => aoEscolher(null)} />;
  return (
    <View style={{ gap: 8 }}>
      <Campo rotulo={rotulo} value={busca} onChangeText={setBusca} placeholder="Digite para buscar" />
      {opcoes.map((x) => <Botao key={x.id} tipo="contorno" titulo={x.nome} onPress={() => aoEscolher(x)} />)}
    </View>
  );
}

function FormVenda({ atual, aoFechar }) {
  const clientes = useClientes();
  const empreendimentos = useEmpreendimentos();
  const criar = useCriarVenda();
  const alterar = useAtualizarVenda();
  const [cliente, setCliente] = useState(atual?.cliente ?? null);
  const [emp, setEmp] = useState(atual?.empreendimento ?? null);
  const [valor, setValor] = useState(atual ? String(atual.valor) : "");
  const [unidade, setUnidade] = useState(atual?.unidade ?? "");
  const [data, setData] = useState(() => (atual?.data_venda ? deIso(atual.data_venda) : new Date()));
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState("");

  async function salvar() {
    setErro("");
    setErros({});
    const corpo = { valor: Number(String(valor).replace(/\./g, "").replace(",", ".")), unidade, dataVenda: isoDoDia(data), empreendimentoId: emp?.id ?? null };
    try {
      if (atual) await alterar.mutateAsync({ id: atual.id, dados: corpo });
      else await criar.mutateAsync({ ...corpo, clienteId: cliente?.id });
      aoFechar();
    } catch (e) {
      setErro(e.message);
      setErros(e.fieldErrors ?? {});
    }
  }

  return (
    <Cartao estilo={{ borderColor: cores.dourado }}>
      <Text style={[s.texto, { fontWeight: "700" }]}>{atual ? "Corrigir venda" : "Lançar venda"}</Text>
      {atual ? <Text style={s.texto2}>Cliente: {atual.cliente?.nome ?? "—"}</Text> : (
        <Escolha rotulo="Cliente da carteira" lista={clientes.data} escolhido={cliente} aoEscolher={setCliente} textoBusca={(c) => c.nome} />
      )}
      {erros.clienteId ? <Erro texto={erros.clienteId} /> : null}
      <Escolha rotulo="Empreendimento" lista={empreendimentos.data} escolhido={emp} aoEscolher={setEmp} textoBusca={(e) => `${e.nome} ${e.bairro ?? ""}`} />
      <Campo rotulo="Valor (R$)" value={valor} onChangeText={setValor} keyboardType="numeric" erro={erros.valor} placeholder="Ex.: 289000" />
      <Campo rotulo="Unidade" value={unidade} onChangeText={setUnidade} erro={erros.unidade} placeholder="Ex.: Torre A, 1203" />
      <SeletorDataHora rotulo="Data da venda" valor={data} aoMudar={setData} soData />
      {erros.dataVenda ? <Erro texto={erros.dataVenda} /> : null}
      <Erro texto={erro} />
      <View style={s.linha}>
        <Botao titulo="Cancelar" tipo="contorno" onPress={aoFechar} estilo={{ flex: 1 }} />
        <Botao titulo="Salvar" icone="checkmark" onPress={salvar} carregando={criar.isPending || alterar.isPending} estilo={{ flex: 1 }} />
      </View>
    </Cartao>
  );
}

export default function VendasTela() {
  const vendas = useVendas();
  const vgv = useVgv();
  const excluir = useExcluirVenda();
  const [formulario, setFormulario] = useState(null);

  function confirmarExclusao(v) {
    Alert.alert("Excluir venda?", `${v.cliente?.nome ?? "Cliente"} · ${brl(v.valor)}`, [
      { text: "Voltar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => excluir.mutateAsync(v.id).catch((e) => Alert.alert("Não deu para excluir", e.message)) },
    ]);
  }

  if (vendas.isLoading) return <Carregando />;
  const lista = vendas.data ?? [];

  return (
    <ScrollView style={s.tela} contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={vendas.isRefetching} tintColor={cores.dourado} onRefresh={() => { vendas.refetch(); vgv.refetch(); }} />}>
      <Card mode="outlined" style={{ backgroundColor: cores.cartao, borderColor: cores.linha, borderRadius: raio.grande }}>
        <Card.Content>
          <Text style={s.texto2}>VGV confirmado</Text>
          <Text style={{ color: cores.texto, fontSize: 26, fontWeight: "700" }}>{brl(vgv.data?.total ?? 0)}</Text>
          <Text style={s.texto3}>{vgv.data?.quantidade ?? 0} venda(s) confirmada(s)</Text>
        </Card.Content>
      </Card>
      {!formulario && <Botao titulo="Lançar venda" icone="add" onPress={() => setFormulario("nova")} />}
      {formulario && <FormVenda key={formulario === "nova" ? "nova" : formulario.id} atual={formulario === "nova" ? null : formulario} aoFechar={() => setFormulario(null)} />}
      <Erro texto={vendas.error?.message} />
      {lista.length === 0 && <Vazio titulo="Nenhuma venda lançada" texto="Depois de fechar, lance a venda para o gerente confirmar." icone="cash-outline" />}
      {lista.map((v) => {
        const [rotulo, cor] = STATUS[v.status] ?? STATUS.pendente;
        return (
          <Cartao key={v.id}>
            <View style={[s.linha, { justifyContent: "space-between" }]}>
              <Text style={[s.texto, { fontWeight: "700", flex: 1 }]} numberOfLines={1}>{v.cliente?.nome ?? "Cliente"}</Text>
              <Selo texto={rotulo} cor={cor} />
            </View>
            <Text style={{ color: cores.texto, fontSize: 18 }}>{brl(v.valor)}</Text>
            <Text style={s.texto2}>{[v.empreendimento?.nome, v.unidade, v.data_venda ? dia(deIso(v.data_venda)) : null].filter(Boolean).join(" · ")}</Text>
            {v.status === "pendente" && (
              <View style={s.linha}>
                <Botao titulo="Corrigir" tipo="contorno" icone="create-outline" onPress={() => setFormulario(v)} estilo={{ flex: 1 }} />
                <Botao titulo="Excluir" tipo="perigo" icone="trash-outline" onPress={() => confirmarExclusao(v)} estilo={{ flex: 1 }} />
              </View>
            )}
          </Cartao>
        );
      })}
    </ScrollView>
  );
}
