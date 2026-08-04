import { describe, expect, it } from "vitest";

import { compararBlocos, contarMudancas, extrairBlocos } from "@/lib/comparar";

describe("extrairBlocos", () => {
  it("separa um bloco por parágrafo, título e item", () => {
    const blocos = extrairBlocos("<h2>Título</h2><p>um</p><ul><li>dois</li></ul>");

    expect(blocos).toEqual(["Título", "um", "dois"]);
  });

  it("ignora espaço repetido e linhas vazias", () => {
    expect(extrairBlocos("<p>  muito    espaço  </p><p></p>")).toEqual(["muito espaço"]);
  });
});

describe("compararBlocos", () => {
  it("reconhece o que continua igual", () => {
    const linhas = compararBlocos(["a", "b"], ["a", "b"]);

    expect(linhas.every((linha) => linha.tipo === "igual")).toBe(true);
  });

  it("aponta o parágrafo incluído", () => {
    const linhas = compararBlocos(["a"], ["a", "b"]);
    const { adicionados, removidos } = contarMudancas(linhas);

    expect(adicionados).toBe(1);
    expect(removidos).toBe(0);
    expect(linhas.find((linha) => linha.tipo === "adicionado")?.texto).toBe("b");
  });

  it("aponta o parágrafo retirado", () => {
    const linhas = compararBlocos(["a", "b"], ["a"]);
    const { adicionados, removidos } = contarMudancas(linhas);

    expect(adicionados).toBe(0);
    expect(removidos).toBe(1);
  });

  it("trata alteração como uma retirada mais uma inclusão", () => {
    const linhas = compararBlocos(["passo antigo"], ["passo novo"]);
    const { adicionados, removidos } = contarMudancas(linhas);

    expect(adicionados).toBe(1);
    expect(removidos).toBe(1);
  });

  it("preserva o que não mudou quando algo é inserido no meio", () => {
    const linhas = compararBlocos(["a", "c"], ["a", "b", "c"]);

    expect(linhas.filter((linha) => linha.tipo === "igual").map((l) => l.texto)).toEqual([
      "a",
      "c",
    ]);
  });

  it("lida com versão vazia dos dois lados", () => {
    expect(compararBlocos([], [])).toEqual([]);
    expect(contarMudancas(compararBlocos([], ["a"]))).toEqual({
      adicionados: 1,
      removidos: 0,
    });
  });
});
