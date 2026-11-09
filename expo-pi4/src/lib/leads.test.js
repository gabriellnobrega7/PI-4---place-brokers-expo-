// Rode com: node --test src/lib/leads.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { assuntoDoContato, detalheDoPedido, tipoDoLead } from "./leads.js";

const venda = "Interesse em: Quero vender meu imóvel — via página prontos e seminovos\nImóvel para vender: Apartamento · Boa Viagem, Recife · 3 quartos · 92 m² · quer R$ 750 mil · Quitado\nAutorizou o contato";
const usado = "Interesse em: Imóvel pronto ou usado — via prontos e usados\nProcura: 3 quartos em Boa Viagem até R$ 700 mil";

test("tipo do lead pela mensagem do site", () => {
  assert.equal(tipoDoLead(venda), "captacao");
  assert.equal(tipoDoLead(usado), "pronto_usado");
  assert.equal(tipoDoLead("Interesse em: Araçá Prime — via lista da home"), null);
  assert.equal(tipoDoLead(null), null);
});

test("detalhe do pedido", () => {
  assert.equal(detalheDoPedido(venda), "Apartamento · Boa Viagem, Recife · 3 quartos · 92 m² · quer R$ 750 mil · Quitado");
  assert.equal(detalheDoPedido(usado), "3 quartos em Boa Viagem até R$ 700 mil");
  assert.equal(detalheDoPedido("Interesse em: Araçá Prime"), "");
});

test("assunto do WhatsApp", () => {
  assert.equal(assuntoDoContato({ mensagem: venda }), "sobre o imóvel que você quer vender");
  assert.equal(assuntoDoContato({ mensagem: usado }), "sobre o imóvel pronto ou usado que você procura");
  assert.equal(assuntoDoContato({ mensagem: "", empreendimento: { nome: "Parc Benvinda" } }), "sobre o seu interesse no Parc Benvinda");
  assert.equal(assuntoDoContato({}), "sobre o seu interesse");
});
