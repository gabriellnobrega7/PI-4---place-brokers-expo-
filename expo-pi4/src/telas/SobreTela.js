// Sobre (Sofia): o que é o app, a equipe e o que cada um fez.
import { Linking, ScrollView } from "react-native";
import Constants from "expo-constants";
import { Card, Divider, List, Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { Botao, s } from "../componentes/ui";
import { API_URL, SITE_URL } from "../config";
import { cores, raio } from "../tema";

const EQUIPE = [
  { nome: "Arthur Vinícius", parte: "Clientes (cadastro, edição, exclusão e agendamentos do cliente), EAS e APK" },
  { nome: "Gabriel Soares", parte: "Base do app, navegação, login, cadastro, início e catálogo" },
  { nome: "João Victor Varela", parte: "Meus leads, histórico de atendimento (atividades) e aviso de lead novo" },
  { nome: "Sérgio Bandeira da Cruz", parte: "Agenda: novo agendamento, remarcar, confirmar e cancelar" },
  { nome: "Sofia Viana Perez", parte: "Perfil, vendas, componentes e tema (React Native Paper)" },
];

const cartao = { backgroundColor: cores.cartao, borderColor: cores.linha, borderRadius: raio.grande };

export default function SobreTela() {
  return (
    <ScrollView style={s.tela} contentContainerStyle={s.conteudo}>
      <Card mode="outlined" style={cartao}>
        <Card.Title title="Place Brokers · Área do corretor" titleStyle={{ color: cores.texto, fontWeight: "700" }}
          subtitle={`Versão ${Constants.expoConfig?.version ?? "1.0.0"}`} subtitleStyle={{ color: cores.texto3 }}
          left={() => <Ionicons name="business" size={26} color={cores.dourado} />} />
        <Card.Content style={{ gap: 8 }}>
          <Text style={s.texto2}>
            App da imobiliária Place Brokers para o corretor atender os leads que chegam pela roleta, cuidar da carteira de
            clientes, marcar visitas, lançar vendas e consultar o catálogo de empreendimentos com books e tabelas.
          </Text>
          <Text style={s.texto3}>Projeto Integrador 4 · Sistemas para Internet · UNICAP · 2026.2</Text>
        </Card.Content>
      </Card>

      <Card mode="outlined" style={cartao}>
        <Card.Title title="Equipe" titleStyle={{ color: cores.texto, fontWeight: "700" }} />
        {EQUIPE.map((p, i) => (
          <List.Item key={p.nome} title={p.nome} description={p.parte} descriptionNumberOfLines={3}
            titleStyle={{ color: cores.texto }} descriptionStyle={{ color: cores.texto2 }}
            left={(props) => <List.Icon {...props} icon={({ size, color }) => <Ionicons name="person-circle-outline" size={size} color={color} />} color={cores.dourado} />}
            style={i ? { borderTopWidth: 1, borderTopColor: cores.linha } : null} />
        ))}
      </Card>

      <Card mode="outlined" style={cartao}>
        <Card.Title title="Como foi feito" titleStyle={{ color: cores.texto, fontWeight: "700" }} />
        <Card.Content style={{ gap: 6 }}>
          <Text style={s.texto2}>React Native + Expo (Expo Router), estado global com Zustand, Axios + TanStack Query e o UI Kit React Native Paper.</Text>
          <Divider style={{ backgroundColor: cores.linha, marginVertical: 4 }} />
          <Text style={s.texto3}>Back-end Express + PostgreSQL da disciplina AOS: {API_URL}</Text>
        </Card.Content>
      </Card>

      <Botao titulo="Abrir o site da Place" tipo="contorno" icone="globe-outline" onPress={() => Linking.openURL(SITE_URL)} />
    </ScrollView>
  );
}
