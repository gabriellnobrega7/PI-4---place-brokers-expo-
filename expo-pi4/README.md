# Place Brokers — App do corretor (React Native + Expo)

Entrega da disciplina **Dispositivos Móveis** (prazo 27/11/2026). É a área do corretor no celular: os leads que chegam pela roleta, a carteira de clientes, a agenda de visitas, as vendas e o catálogo. Usa o **back-end Express da disciplina AOS** (o mesmo do site), com as rotas no Swagger (`/docs`) e na coleção do Postman do back.

## Equipe

| Nome | RA |
| --- | --- |
| Arthur Vinícius | 00000859883 |
| Gabriel Soares | 00000859526 |
| João Victor Varela dos Santos | 00000859893 |
| Sérgio Bandeira da Cruz | 00000857151 |
| Sofia Viana Perez | 00000857166 |

## Requisitos da disciplina

| Requisito | Onde está |
| --- | --- |
| Expo Router | pasta `app/` (rotas por arquivo, abas em `app/(abas)/`, telas protegidas por login com `Stack.Protected`) |
| Estado global | Zustand em `src/estado/sessao.js` (usuário logado, entrar, cadastrar, sair) |
| Telas Home e Sobre | `src/telas/HomeTela.js` (Início) e `src/telas/SobreTela.js` |
| 1 tela por integrante | tabela abaixo |
| Interação | botões, campos de texto, chips de seleção, chave liga/desliga, seletor de data e hora, busca |
| Axios + TanStack Query | `src/api/cliente.js` (Axios, token e renovação automática) e `src/api/consultas.js` (consultas e mutações) |
| CRUD de 4 entidades | **Clientes**, **Agendamentos**, **Leads** e **Vendas**: listar, ver, criar, alterar e excluir |
| 2 relacionamentos | **Lead → atividades** (`/leads/:id/atividades`, tela do lead) e **Cliente → agendamentos** (`/clientes/:id/agendamentos`, tela do cliente) |
| Login, logout e sign up | `LoginTela`, `CadastroTela` (`POST /auth/register`) e Sair no Perfil (`POST /auth/logout`) |
| UI Kit | React Native Paper (tema com as cores da Place em `src/tema.js`; componentes em `src/componentes/ui.js`) |

## Telas e quem fez cada parte

| Integrante | Telas | Arquivos |
| --- | --- | --- |
| Gabriel | Início, Login, Cadastro, Catálogo, Empreendimento; base do app e navegação | `app/_layout.js`, `app/(abas)/_layout.js`, `src/telas/HomeTela.js`, `LoginTela.js`, `CadastroTela.js`, `CatalogoTela.js`, `EmpreendimentoTela.js`, `src/estado/sessao.js` |
| João | Meus leads, Lead (histórico de atendimento = atividades), Cadastrar/editar lead; aviso de lead novo | `src/telas/LeadsTela.js`, `LeadDetalheTela.js`, `LeadFormTela.js`, `src/notificacoes/push.js` |
| Sérgio | Agenda, Novo agendamento (remarcar, confirmar, realizado, cancelar) | `src/telas/AgendaTela.js`, `NovoAgendamentoTela.js`, `src/lib/datas.js` |
| Sofia | Perfil, Vendas, Sobre; componentes e tema (Paper) | `src/telas/PerfilTela.js`, `VendasTela.js`, `SobreTela.js`, `src/componentes/`, `src/tema.js` |
| Arthur | Clientes, Cliente (com os agendamentos do cliente), Cadastrar/editar cliente; EAS e publicação | `src/telas/ClientesTela.js`, `ClienteDetalheTela.js`, `ClienteFormTela.js`, `eas.json`, `app.json` |

## Como rodar

Precisa do Node 22+ e do app **Expo Go** (SDK 58) no celular. No Android, o Expo Go certo se instala pelo próprio Expo CLI: aperte `a` com o celular ligado no USB.

```powershell
cd expo-pi4
npm install
npx expo start            # leia o QR code com o Expo Go
npm test                  # regras de preço, telefone, agenda e leads
```

Para usar o back rodando no seu PC, crie um `.env` com o IP do PC na rede (`EXPO_PUBLIC_API_URL=http://192.168.0.10:3333`). No celular, `localhost` é o próprio celular.

## Publicar no Expo (QR code do Expo Go)

Owner: organização `arthurmss-team` (a mesma em que o professor foi convidado).

```powershell
cd expo-pi4
npx eas-cli login
npx eas-cli update:configure     # só na primeira vez (grava runtimeVersion e updates.url)
npx eas-cli update --branch main --message "Entrega Dispositivos Móveis"
```

O link da atualização (com o QR code para abrir no Expo Go) aparece no terminal e em expo.dev → arthurmss-team → expo-pi4 → Updates.

## Login e sessão

- Mesmo login do site. O app aceita só corretor: gerente e admin usam o site.
- O token fica no cofre do celular (`expo-secure-store`), não em texto puro.
- O token vale 1 hora. Quando vence, o Axios troca sozinho pelo `refreshToken` em `POST /auth/renovar`. Se não der, o app volta para o login.
- Sair chama `POST /auth/logout`, que encerra a sessão no servidor.

## Avisos no celular

- **Lead novo**: depois do login, o app pede permissão e registra o aparelho em `POST /notificacoes/inscricao`. O push remoto **não funciona no Expo Go do Android**; teste com o APK (`npm run apk`).
- **Lembrete de retorno**: grava o retorno no lead (aparece no site) e agenda um alarme no próprio celular.

## Regras que o app segue (iguais às do site)

- Lead novo aparece no topo, com o tempo de espera. Ligar ou chamar no WhatsApp registra o contato e passa o lead para "em atendimento".
- Corretor só vê e altera o que é da própria carteira. Só exclui lead que ele mesmo cadastrou; cliente com venda, visita já realizada e venda confirmada não são excluídos.
- Botões com pelo menos 48 px, abas embaixo para alcançar com o polegar, tema escuro com o dourado da marca.
