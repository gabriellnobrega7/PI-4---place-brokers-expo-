// Mesmas cores do site (src/index.css do front).
export const cores = {
  pagina: "#08152b",
  cartao: "#0d2040",
  cartao2: "#0b1b36",
  linha: "#1c3459",
  texto: "#ffffff",
  texto2: "#c3cee0",
  texto3: "#8a9ab5",
  dourado: "#e9ad5a",
  dourado2: "#c98b3f",
  ok: "#3ddc97",
  perigo: "#ef4d4d",
  info: "#4da3ff",
  whatsapp: "#25D366",
};

export const raio = { pequeno: 10, medio: 14, grande: 20 };
// Alvo de toque mínimo (o corretor usa o app na rua, com uma mão).
export const ALVO = 48;
// Tema do React Native Paper (UI Kit) com as cores da Place.
import { MD3DarkTheme } from "react-native-paper";

export const temaPaper = {
  ...MD3DarkTheme,
  roundness: 4, // Paper multiplica: 4 → cantos de 16 px nos botões e cartões
  colors: {
    ...MD3DarkTheme.colors,
    primary: cores.dourado,
    onPrimary: "#1a1408",
    primaryContainer: "rgba(233,173,90,0.18)",
    onPrimaryContainer: cores.dourado,
    secondary: cores.info,
    background: cores.pagina,
    surface: cores.cartao,
    surfaceVariant: cores.cartao2,
    onSurface: cores.texto,
    onSurfaceVariant: cores.texto2,
    outline: cores.linha,
    outlineVariant: cores.linha,
    error: cores.perigo,
    elevation: { ...MD3DarkTheme.colors.elevation, level1: cores.cartao, level2: cores.cartao2, level3: cores.cartao2 },
  },
};
