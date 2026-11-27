// O React Compiler (ligado no app.json) transforma as dependências das telas em leituras feitas
// em todo render. Se uma tela usa `consulta.data.campo` sem `?.`, essa leitura acontece antes de os
// dados chegarem e o app cai ("Cannot read property 'nome' of undefined", visto no iPhone em 26/11).
// Este teste compila cada tela como o Metro faz e recusa dependência `x.data.campo` sem `?.`.
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const babel = require("@babel/core");

const raiz = path.join(__dirname, "..", "..");
const telas = fs.readdirSync(path.join(raiz, "src", "telas")).filter((f) => f.endsWith(".js"));

for (const arquivo of telas) {
  test(`${arquivo}: nenhuma leitura de .data.campo antes de os dados chegarem`, () => {
    const { code } = babel.transformFileSync(path.join(raiz, "src", "telas", arquivo), {
      babelrc: false,
      configFile: false,
      presets: ["babel-preset-expo"],
      plugins: ["babel-plugin-react-compiler"],
      caller: { name: "metro", platform: "ios", bundler: "metro" },
    });
    const perigosas = [...code.matchAll(/\$\[\d+\]\s*!==\s*([\w$]+\.data\.[\w$.]+)/g)].map((m) => m[1]);
    assert.deepStrictEqual(perigosas, [], `use ?. em: ${perigosas.join(", ")}`);
  });
}
