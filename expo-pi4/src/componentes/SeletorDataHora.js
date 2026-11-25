// Escolha de data e hora com o seletor nativo do celular (usado nos formulários novos).
import { useState } from "react";
import { Platform, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text } from "react-native-paper";
import { Botao, s } from "./ui";
import { combinarDataHora, dia, hora } from "../lib/datas";

export default function SeletorDataHora({ rotulo, valor, aoMudar, minimo, soData = false }) {
  const [modo, setModo] = useState(null);
  return (
    <View style={{ gap: 8 }}>
      {rotulo ? <Text style={s.rotulo}>{rotulo}</Text> : null}
      <View style={s.linha}>
        <Botao tipo="contorno" icone="calendar-outline" titulo={dia(valor)} onPress={() => setModo("date")} estilo={{ flex: 1 }} />
        {!soData && <Botao tipo="contorno" icone="time-outline" titulo={hora(valor)} onPress={() => setModo("time")} estilo={{ flex: 1 }} />}
      </View>
      {modo && (
        <View style={{ gap: 8 }}>
          <DateTimePicker
            key={modo}
            value={valor}
            mode={modo}
            is24Hour
            minimumDate={modo === "date" ? minimo : undefined}
            maximumDate={soData ? new Date() : undefined}
            onChange={(evento, escolhido) => {
              if (Platform.OS !== "ios") setModo(null);
              if (evento.type !== "dismissed" && escolhido) aoMudar(combinarDataHora(valor, escolhido, modo));
            }}
          />
          {Platform.OS === "ios" && <Botao tipo="contorno" titulo="Concluir seleção" onPress={() => setModo(null)} />}
        </View>
      )}
    </View>
  );
}
