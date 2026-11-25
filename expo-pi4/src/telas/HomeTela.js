// Início (Gabriel): o resumo do dia do corretor e os atalhos para as outras telas.
import { useMemo } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Card, Text, TouchableRipple } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAgendamentos, useClientes, useMeusLeads, useRetornos, useVgv } from "../api/consultas";
import { useSessao } from "../estado/sessao";
import { Erro, s } from "../componentes/ui";
import { hora, separarAgenda } from "../lib/datas";
import { brl } from "../lib/preco";
import { saudacao } from "../lib/telefone";
import { cores, raio } from "../tema";

function Indicador({ icone, numero, rotulo, cor = cores.dourado, onPress }) {
  return (
    <Card mode="outlined" style={{ flex: 1, minWidth: 150, backgroundColor: cores.cartao, borderColor: cores.linha, borderRadius: raio.grande }}>
      <TouchableRipple onPress={onPress} borderless style={{ borderRadius: raio.grande }} accessibilityRole="button" accessibilityLabel={`${numero} ${rotulo}`}>
        <View style={{ padding: 16, gap: 6 }}>
          <Ionicons name={icone} size={22} color={cor} />
          <Text style={{ color: cores.texto, fontSize: 26, fontWeight: "700" }}>{numero}</Text>
          <Text style={s.texto2}>{rotulo}</Text>
        </View>
      </TouchableRipple>
    </Card>
  );
}

export default function HomeTela() {
  const router = useRouter();
  const usuario = useSessao((estado) => estado.usuario);
  const leads = useMeusLeads();
  const agenda = useAgendamentos();
  const retornos = useRetornos();
  const clientes = useClientes();
  const vgv = useVgv();

  const consultas = [leads, agenda, retornos, clientes, vgv];
  const atualizando = consultas.some((c) => c.isRefetching);
  const erro = consultas.find((c) => c.error)?.error?.message ?? "";

  const hoje = useMemo(() => separarAgenda(agenda.data ?? []).hoje, [agenda.data]);
  const novos = (leads.data ?? []).filter((l) => l.status === "novo").length;
  const atrasados = (retornos.data ?? []).filter((r) => r.atrasado).length;
  const primeiroNome = (usuario?.nome ?? "").split(" ")[0];

  return (
    <ScrollView
      style={s.tela}
      contentContainerStyle={s.conteudo}
      refreshControl={<RefreshControl refreshing={atualizando} tintColor={cores.dourado} onRefresh={() => consultas.forEach((c) => c.refetch())} />}
    >
      <Text style={s.titulo}>{saudacao()}{primeiroNome ? `, ${primeiroNome}` : ""}!</Text>
      <Text style={s.subtitulo}>Seu dia na Place Brokers.</Text>
      <Erro texto={erro} />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Indicador icone="people" numero={novos} rotulo="leads esperando retorno" cor={novos ? cores.perigo : cores.dourado} onPress={() => router.push("/leads")} />
        <Indicador icone="calendar" numero={hoje.length} rotulo="compromissos hoje" onPress={() => router.push("/agenda")} />
        <Indicador icone="alarm" numero={(retornos.data ?? []).length} rotulo={atrasados ? `retornos (${atrasados} atrasado${atrasados > 1 ? "s" : ""})` : "retornos marcados"} onPress={() => router.push("/leads")} />
        <Indicador icone="briefcase" numero={(clientes.data ?? []).length} rotulo="clientes na carteira" onPress={() => router.push("/clientes")} />
      </View>

      <Card mode="outlined" style={{ backgroundColor: cores.cartao, borderColor: cores.linha, borderRadius: raio.grande }} onPress={() => router.push("/vendas")}>
        <Card.Title title="VGV confirmado" titleStyle={{ color: cores.texto2 }} left={() => <Ionicons name="trending-up" size={22} color={cores.ok} />} />
        <Card.Content>
          <Text style={{ color: cores.texto, fontSize: 24, fontWeight: "700" }}>{vgv.data ? brl(vgv.data.total ?? 0) : "—"}</Text>
          <Text style={s.texto3}>{vgv.data?.quantidade ?? 0} venda(s) confirmada(s) pelo gerente</Text>
        </Card.Content>
      </Card>

      {hoje.length > 0 && (
        <Card mode="outlined" style={{ backgroundColor: cores.cartao, borderColor: cores.linha, borderRadius: raio.grande }}>
          <Card.Title title="Hoje" titleStyle={{ color: cores.texto, fontWeight: "700" }} />
          <Card.Content style={{ gap: 6 }}>
            {hoje.slice(0, 4).map((a) => (
              <Text key={a.id} style={s.texto2}>{hora(a.dataHora)} · {a.cliente?.nome ?? "Cliente"} · {a.empreendimento?.nome ?? a.local ?? "Escritório"}</Text>
            ))}
          </Card.Content>
        </Card>
      )}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Indicador icone="business" numero="Catálogo" rotulo="empreendimentos e books" onPress={() => router.push("/catalogo")} />
        <Indicador icone="information-circle" numero="Sobre" rotulo="o app e a equipe" onPress={() => router.push("/sobre")} />
      </View>
    </ScrollView>
  );
}
