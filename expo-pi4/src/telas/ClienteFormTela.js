// Cadastrar ou editar cliente (Arthur): POST /clientes e PATCH /clientes/:id.
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useAtualizarCliente, useCliente, useCriarCliente } from "../api/consultas";
import { Botao, Campo, Carregando, Erro, s } from "../componentes/ui";

export default function ClienteFormTela() {
  const { id } = useLocalSearchParams();
  const editando = Boolean(id);
  const router = useRouter();
  const navigation = useNavigation();
  const existente = useCliente(id);
  const criar = useCriarCliente();
  const atualizar = useAtualizarCliente();
  const [dados, setDados] = useState({ nome: "", telefone: "", email: "", observacoes: "" });
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState("");
  const campo = (chave) => (valor) => setDados((d) => ({ ...d, [chave]: valor }));

  useEffect(() => { navigation.setOptions({ title: editando ? "Editar cliente" : "Novo cliente" }); }, [editando, navigation]);
  useEffect(() => {
    const c = existente.data;
    if (c) setDados({ nome: c.nome ?? "", telefone: c.telefone ?? "", email: c.email ?? "", observacoes: c.observacoes ?? "" });
  }, [existente.data]);

  async function salvar() {
    setErro("");
    setErros({});
    const corpo = { nome: dados.nome, telefone: dados.telefone, email: dados.email.trim() || null, observacoes: dados.observacoes.trim() || null };
    try {
      const cliente = editando ? await atualizar.mutateAsync({ id, dados: corpo }) : await criar.mutateAsync(corpo);
      if (editando) router.back();
      else router.replace({ pathname: "/cliente/[id]", params: { id: String(cliente.id) } });
    } catch (e) {
      setErro(e.message);
      setErros(e.fieldErrors ?? {});
    }
  }

  if (editando && existente.isLoading) return <Carregando />;

  return (
    <ScrollView style={s.tela} contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
      <Campo rotulo="Nome" value={dados.nome} onChangeText={campo("nome")} erro={erros.nome} autoComplete="name" />
      <Campo rotulo="Telefone com DDD" value={dados.telefone} onChangeText={campo("telefone")} erro={erros.telefone} keyboardType="phone-pad" />
      <Campo rotulo="E-mail (opcional)" value={dados.email} onChangeText={campo("email")} erro={erros.email} autoCapitalize="none" keyboardType="email-address" />
      <Campo rotulo="Observações (opcional)" value={dados.observacoes} onChangeText={campo("observacoes")} erro={erros.observacoes} multiline
        placeholder="Ex.: quer 2 quartos perto do metrô, usa FGTS" />
      <Erro texto={erro || existente.error?.message} />
      <Botao titulo={editando ? "Salvar alterações" : "Cadastrar cliente"} icone="checkmark" onPress={salvar} carregando={criar.isPending || atualizar.isPending} />
    </ScrollView>
  );
}
