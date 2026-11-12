// Testes das regras puras do app: rode com `npm test` (usa o test runner do próprio Node).
import { test } from "node:test";
import assert from "node:assert/strict";
import { faixa, mensagemDoEmpreendimento, precoDoEmpreendimento, prazoDoEmpreendimento } from "./preco.js";
import { comDdi, formatarTelefone, linkWhatsApp, saudacao } from "./telefone.js";
import { dia, separarAgenda, tempoDesde } from "./datas.js";

test("preço: MCMV mostra parcela; os outros, valor total", () => {
  assert.equal(precoDoEmpreendimento({ segmento: "mcmv", parcela_min: 499 }).sufixo, "/mês");
  assert.equal(precoDoEmpreendimento({ segmento: "litoral", preco_min: 219322 }).rotulo, "A partir de");
  assert.equal(precoDoEmpreendimento({}).valor, "Sob consulta");
});

test("preço: pronto e usado mostram o preço cheio, mesmo no MCMV (entrada à vista)", () => {
  const pronto = precoDoEmpreendimento({ segmento: "mcmv", status: "pronto", parcela_min: 899, preco_min: "276000.00" });
  assert.equal(pronto.rotulo, "A partir de");
  assert.equal(pronto.sufixo, "");
  assert.equal(pronto.valor.replace(/\s/g, " "), "R$ 276.000");
  assert.equal(precoDoEmpreendimento({ segmento: "mcmv", status: "usado", parcela_min: 399, preco_min: 180000 }).rotulo, "A partir de");
  assert.equal(precoDoEmpreendimento({ segmento: "mcmv", status: "obras", parcela_min: 899, preco_min: 269900 }).rotulo, "Parcelas a partir de");
  assert.equal(precoDoEmpreendimento({ segmento: "mcmv", status: "pronto", parcela_min: 899 }).sufixo, "/mês");
});

test("prazo e faixa", () => {
  assert.equal(prazoDoEmpreendimento({ status: "pronto" }), "Pronto para morar");
  assert.equal(prazoDoEmpreendimento({ previsao_entrega: "2029-12-01" }), "Entrega prevista: dez/2029");
  assert.equal(faixa(2, 3, "quarto", "quartos"), "2 a 3 quartos");
  assert.equal(faixa(1, 1, "vaga", "vagas"), "1 vaga");
});

test("mensagem para o cliente não fala de tabela", () => {
  const m = mensagemDoEmpreendimento({ nome: "Vila Alta Vista", bairro: "Janga", cidade: "Paulista", segmento: "mcmv", parcela_min: 499 }, "https://x/imoveis/1");
  assert.match(m, /\*Vila Alta Vista\* — Janga, Paulista/);
  assert.match(m, /https:\/\/x\/imoveis\/1/);
  assert.doesNotMatch(m.toLowerCase(), /tabela/);
});

test("telefone", () => {
  assert.equal(formatarTelefone("81999998888"), "(81) 99999-8888");
  assert.equal(formatarTelefone("5581999998888"), "(81) 99999-8888");
  assert.equal(comDdi("(81) 99999-8888"), "5581999998888");
  assert.equal(linkWhatsApp("81999998888", "Bom dia"), "https://wa.me/5581999998888?text=Bom%20dia");
  assert.equal(saudacao(new Date(2026, 10, 2, 9)), "Bom dia");
  assert.equal(saudacao(new Date(2026, 10, 2, 20)), "Boa noite");
});

test("datas e agenda", () => {
  const agora = new Date(2026, 10, 2, 10, 0);
  assert.equal(dia(new Date(2026, 10, 2, 15), agora), "Hoje");
  assert.equal(dia(new Date(2026, 10, 3, 9), agora), "Amanhã");
  assert.equal(tempoDesde(new Date(2026, 10, 2, 9, 55), agora), "há 5 min");
  const ag = [
    { id: "a", status: "agendado", dataHora: new Date(2026, 10, 2, 15).toISOString() },
    { id: "b", status: "confirmado", dataHora: new Date(2026, 10, 5, 9).toISOString() },
    { id: "c", status: "realizado", dataHora: new Date(2026, 10, 1, 9).toISOString() },
    { id: "d", status: "cancelado", dataHora: new Date(2026, 10, 6, 9).toISOString() },
  ];
  const s = separarAgenda(ag, agora);
  assert.deepEqual(s.hoje.map((x) => x.id), ["a"]);
  assert.deepEqual(s.proximos.map((x) => x.id), ["b"]);
  assert.deepEqual(s.historico.map((x) => x.id), ["d", "c"]);
});
