import { describe, expect, it } from "vitest";

import { expandirVideos } from "@/lib/renderizar";
import { prepararSumario } from "@/lib/sumario";

describe("prepararSumario", () => {
  it("cria um item por título principal, seção e subseção", () => {
    const { itens } = prepararSumario(
      "<h1>Parte 1</h1><h2>Instalação</h2><h3>Pré-requisitos</h3>",
    );

    expect(itens).toEqual([
      { id: "parte-1", texto: "Parte 1", nivel: 1 },
      { id: "instalacao", texto: "Instalação", nivel: 2 },
      { id: "pre-requisitos", texto: "Pré-requisitos", nivel: 3 },
    ]);
  });

  it("põe o identificador no título, para a âncora funcionar", () => {
    const { html } = prepararSumario("<h2>Balança</h2>");

    expect(html).toContain('id="balanca"');
  });

  it("desempata títulos repetidos", () => {
    const { itens } = prepararSumario("<h2>Erros</h2><h2>Erros</h2>");

    expect(itens.map((item) => item.id)).toEqual(["erros", "erros-2"]);
  });

  it("ignora título sem texto", () => {
    const { itens } = prepararSumario("<h2></h2><h2>Válido</h2>");

    expect(itens).toHaveLength(1);
  });
});

describe("expandirVideos", () => {
  it("transforma o marcador gravado em quadro de vídeo", () => {
    const html = expandirVideos(
      '<div data-video-url="https://drive.google.com/file/d/ABC/preview"></div>',
    );

    expect(html).toContain("<iframe");
    expect(html).toContain("https://drive.google.com/file/d/ABC/preview");
  });

  it("descarta marcador com endereço de fora do Drive", () => {
    const html = expandirVideos('<div data-video-url="https://exemplo.com/video"></div>');

    expect(html).not.toContain("iframe");
    expect(html).not.toContain("exemplo.com");
  });
});
