import { describe, expect, it } from "vitest";

import {
  pareceDecodificacaoFalha,
  pareceSeloOuMarca,
  reconstruirOrdemDeLeitura,
  removerLinhasRepetidas,
} from "@/lib/importarPdf";

describe("reconstruirOrdemDeLeitura", () => {
  it("reordena itens que foram desenhados fora de ordem visual", () => {
    // "Depois" tem y menor (mais para baixo na página) mas aparece
    // primeiro no arquivo — comum em PDF de ferramenta de cartão/slide.
    const itens = [
      { str: "Depois", transform: [1, 0, 0, 1, 0, 100] },
      { str: "Antes", transform: [1, 0, 0, 1, 0, 500] },
    ];

    expect(reconstruirOrdemDeLeitura(itens)).toBe("Antes\nDepois");
  });

  it("junta na mesma linha itens próximos na vertical", () => {
    const itens = [
      { str: "Rótulo:", transform: [1, 0, 0, 1, 0, 300] },
      { str: "valor", transform: [1, 0, 0, 1, 60, 301] },
    ];

    expect(reconstruirOrdemDeLeitura(itens)).toBe("Rótulo: valor");
  });

  it("ordena da esquerda para a direita dentro da mesma linha", () => {
    const itens = [
      { str: "direita", transform: [1, 0, 0, 1, 100, 300] },
      { str: "esquerda", transform: [1, 0, 0, 1, 0, 300] },
    ];

    expect(reconstruirOrdemDeLeitura(itens)).toBe("esquerda direita");
  });

  it("ignora itens de espaço em branco", () => {
    const itens = [
      { str: "  ", transform: [1, 0, 0, 1, 0, 300] },
      { str: "texto", transform: [1, 0, 0, 1, 0, 200] },
    ];

    expect(reconstruirOrdemDeLeitura(itens)).toBe("texto");
  });
});

describe("removerLinhasRepetidas", () => {
  it("remove uma linha curta que se repete na maioria das páginas", () => {
    const paginas = [
      "Título 1\ngamma.app\nconteúdo da página um",
      "Título 2\ngamma.app\nconteúdo da página dois",
      "Título 3\ngamma.app\nconteúdo da página três",
    ];

    const resultado = removerLinhasRepetidas(paginas);

    expect(resultado.join("\n")).not.toContain("gamma.app");
    expect(resultado[0]).toContain("Título 1");
    expect(resultado[1]).toContain("conteúdo da página dois");
  });

  it("preserva uma linha que aparece só uma vez", () => {
    const paginas = [
      "Marca repetida\nInformação exclusiva desta página",
      "Marca repetida\noutro conteúdo",
      "Marca repetida\nmais um conteúdo",
    ];

    const resultado = removerLinhasRepetidas(paginas);

    expect(resultado[0]).toContain("Informação exclusiva desta página");
  });

  it("não mexe em nada com menos de três páginas", () => {
    const paginas = ["gamma.app\ntexto", "gamma.app\noutro texto"];

    expect(removerLinhasRepetidas(paginas)).toEqual(paginas);
  });

  it("não remove uma linha longa, mesmo repetida", () => {
    // Uma frase de conteúdo genuína não deveria ser cortada só por
    // coincidência de aparecer em mais de uma página.
    const linhaLonga =
      "Esta é uma frase de conteúdo bem mais longa que um rodapé típico";
    const paginas = [linhaLonga, linhaLonga, linhaLonga];

    expect(removerLinhasRepetidas(paginas)[0]).toBe(linhaLonga);
  });
});

describe("pareceSeloOuMarca", () => {
  it("reconhece um selo tipo crachá, bem mais largo que alto", () => {
    expect(pareceSeloOuMarca(400, 100)).toBe(true);
  });

  it("não confunde um print de tela real, mesmo grande", () => {
    expect(pareceSeloOuMarca(1200, 800)).toBe(false);
  });

  it("não descarta um selo largo se ele for grande demais para ser marca d'água", () => {
    expect(pareceSeloOuMarca(1800, 500)).toBe(false);
  });

  it("aceita a proporção invertida (mais alto que largo)", () => {
    expect(pareceSeloOuMarca(100, 400)).toBe(true);
  });
});

describe("pareceDecodificacaoFalha", () => {
  it("reconhece uma imagem quase toda de uma cor só", () => {
    const bytes = Buffer.alloc(3000, 255);
    expect(pareceDecodificacaoFalha(bytes, 3)).toBe(true);
  });

  it("não confunde uma imagem com variação real de cor", () => {
    const bytes = Buffer.alloc(3000);
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = (i * 97) % 256;
    expect(pareceDecodificacaoFalha(bytes, 3)).toBe(false);
  });
});
