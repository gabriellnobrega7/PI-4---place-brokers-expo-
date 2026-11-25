// A sessão agora é estado global com Zustand (src/estado/sessao.js).
// Este arquivo só reexporta o hook para as telas que já importavam daqui.
export { useSessao } from "./estado/sessao";
