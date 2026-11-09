# Place Brokers — App do corretor (React Native + Expo)

Entrega da disciplina **Dispositivos Móveis** (30/11/2026). É a área do corretor no celular: os leads que chegam pela roleta, a agenda de visitas e o catálogo. Usa a **mesma API do site** (`https://placebrokers-api.onrender.com`). As rotas estão no Swagger (`/docs`) e na coleção do Postman do back.

## Telas e quem cuida de cada parte

| Parte | Quem | Arquivos |
| --- | --- | --- |
| Estrutura, navegação, login, catálogo e detalhe do empreendimento (com envio pelo WhatsApp) | Gabriel | `App.js`, `src/navegacao/`, `src/contexto.js`, `src/api/cliente.js`, `src/api/sessao.js`, `src/telas/LoginTela.js`, `src/telas/CatalogoTela.js`, `src/telas/EmpreendimentoTela.js` |
| Meus leads: ligar, WhatsApp, copiar o número segurando, lembrete com alarme; aviso de lead novo | João | `src/telas/LeadsTela.js`, `src/notificacoes/push.js`, `src/lib/telefone.js` |
| Agenda: listar, agendar, remarcar, confirmar, realizado, não compareceu, cancelar | Sérgio | `src/telas/AgendaTela.js`, `src/telas/NovoAgendamentoTela.js`, `src/lib/datas.js` |
| Perfil e configurações (dados, trocar senha, avisos, sair); revisão de usabilidade no celular | Sofia | `src/telas/PerfilTela.js`, `src/componentes/ui.js`, `src/tema.js` |
| Build e APK (EAS) | Arthur | `eas.json`, `app.json` |

Cada um sobe os commits da própria parte (regra do grupo no Trello).

## Como rodar

Precisa do Node 20+ e do app **Expo Go** no celular. No Android, o Expo Go do SDK 56 se instala pelo próprio Expo CLI: aperte `a` com o celular ligado no USB ou no emulador.

```bash
npm install
npx expo install react react-native expo-status-bar expo-secure-store expo-notifications expo-device expo-constants expo-clipboard @expo/vector-icons @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context @react-native-community/datetimepicker
cp .env.example .env      # no Windows: copy .env.example .env
npx expo start            # leia o QR code com o Expo Go
npm test                  # regras de preço, telefone e agenda
```

O `npx expo install` escolhe as versões compatíveis com o SDK. Rode-o só na primeira vez; depois, `npm install` basta.

Para usar o back rodando no seu PC, coloque no `.env` o IP do PC na rede (`EXPO_PUBLIC_API_URL=http://192.168.0.10:3333`). No celular, `localhost` é o próprio celular.

## Login e sessão

- Mesmo login do site. O app aceita só corretor: gerente e admin usam o site.
- O token fica no cofre do celular (`expo-secure-store`), não em texto puro.
- O token vale 1 hora. Quando vence, o app troca sozinho pelo `refreshToken` em `POST /auth/renovar` e o corretor não precisa digitar a senha de novo. Se a conta for desativada, a renovação falha e o app volta para o login.

## Avisos no celular

- **Lead novo**: depois do login, o app pede permissão, pega o token do Expo e manda para `POST /notificacoes/inscricao` (`{ expoToken }`). O back avisa assim que a roleta entrega um lead. O push remoto **não funciona no Expo Go do Android**; teste com o APK (`npm run apk`) ou com um development build.
- **Lembrete de retorno**: em "Lembrar de retornar", o app grava o retorno no lead (aparece no site) e agenda um alarme no próprio celular. Esse funciona no Expo Go.
- Tocar no aviso abre a aba Meus leads.

## Gerar o APK (Arthur)

```bash
npm install -g eas-cli
eas login
eas init                  # cria o projeto no Expo e grava o projectId no app.json (necessário para o push)
npm run apk               # eas build --platform android --profile preview
```

O link do APK sai no terminal e no painel do Expo. As URLs da API e do site de cada build estão no `eas.json`.

## Regras que o app segue (iguais às do site)

- Lead novo aparece no topo, com o tempo de espera, porque quem retorna primeiro leva o cliente. Ligar ou chamar no WhatsApp registra o contato e passa o lead para "em atendimento"; o gerente vê o tempo de resposta.
- O WhatsApp abre com "Bom dia/Boa tarde/Boa noite, Nome!".
- Ao mandar um empreendimento para o cliente vai só o link público (fotos, valores e mapa). Book e tabela ficam para a reunião.
- Botões com pelo menos 48 px, abas embaixo para alcançar com o polegar, tema escuro com o dourado da marca.