// Cadastrar ou editar lead (João): POST /leads/meus (captação do próprio corretor) e PATCH /leads/:id.
import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Text } from "react-native-paper";
import { useAtualizarLead, useCriarLead, useEmpreendimentos, useLead } from "../api/consultas";
import { Botao, Campo, Carregando, Erro, s } from "../componentes/ui";

const sem = (t = "") => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function LeadFormTela() {
  const { id } = useLocalSearchParams();
  const editando = Boolean(id);
  const router = useRouter();
  const navigation = useNavigation();
  const existente = useLead(id);
  const empreendimentos = useEmpreendimentos();
  const criar = useCriarLead();
  const atualizar = useAtualizarLead();
  const [dados, setDados] = useState({ nome: "", telefone: "", email: "", mensagem: "" });
  const [emp, setEmp] = useState(null);
  const [busca, setBusca] = useState("");
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState("");
  const campo = (chave) => (valor) => setDados((d) => ({ ...d, [chave]: valor }));

  useEffect(() => { navigation.setOptions({ title: editando ? "Editar lead" : "Cadastrar lead" }); }, [editando, navigation]);
  useEffect(() => {
    const l = existente.data;
    if (!l) return;
    setDados({ nome: l.nome ?? "", telefone: l.telefone ?? "", email: l.email ?? "", mensagem: l.mensagem ?? "" });
    setEmp(l.empreendimento ?? null);
  }, [existente.data]);

  const opcoes = useMemo(() => (empreendimentos.data ?? [])
    .filter((e) => !busca || sem(`${e.nome} ${e.bairro ?? ""}`).includes(sem(busca))).slice(0, 5), [empreendimentos.data, busca]);

  async function salvar() {
    setErro("");
    setErros({});
    const corpo = { ...dados, email: dados.email.trim() || null, mensagem: dados.mensagem.trim() || null, empreendimentoId: emp?.id ?? null };
    try {
      const lead = editando ? await atualizar.mutateAsync({ id, dados: corpo }) : await criar.mutateAsync(corpo);
      if (editando) router.back();
      else router.replace({ pathname: "/lead/[id]", params: { id: String(lead.id) } });
    } catch (e) {
      setErro(e.message);
      setErros(e.fieldErrors ?? {});
    }
  }

  if (editando && existente.isLoading) return <Carregando />;

  return (
    <ScrollView style={s.tela} contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
      {!editando && <Text style={s.subtitulo}>Contato que você mesmo captou (indicação, plantão, ligação). Ele entra direto na sua carteira, sem passar pela roleta.</Text>}
      <Campo rotulo="Nome" value={dados.nome} onChangeText={campo("nome")} erro={erros.nome} />
      <Campo rotulo="Telefone com DDD" value={dados.telefone} onChangeText={campo("telefone")} erro={erros.telefone} keyboardType="phone-pad" />
      <Campo rotulo="E-mail (opcional)" value={dados.email} onChangeText={campo("email")} erro={erros.email} autoCapitalize="none" keyboardType="email-address" />
      <Text style={s.rotulo}>Empreendimento de interesse (opcional)</Text>
      {emp ? <Botao tipo="contorno" titulo={`${emp.nome} (trocar)`} onPress={() => setEmp(null)} /> : (
        <View style={{ gap: 8 }}>
          <Campo value={busca} onChangeText={setBusca} placeholder="Buscar pelo nome ou bairro" />
          {busca ? opcoes.map((e) => <Botao key={e.id} tipo="contorno" titulo={e.nome} onPress={() => setEmp(e)} />) : null}
        </View>
      )}
      <Campo rotulo="O que o cliente procura (opcional)" value={dados.mensagem} onChangeText={campo("mensagem")} erro={erros.mensagem} multiline
        placeholder="Ex.: 2 quartos em Boa Viagem até R$ 400 mil" />
      <Erro texto={erro || existente.error?.message} />
      <Botao titulo={editando ? "Salvar alterações" : "Cadastrar lead"} icone="checkmark" onPress={salvar} carregando={criar.isPending || atualizar.isPending} />
    </ScrollView>
  );
}
