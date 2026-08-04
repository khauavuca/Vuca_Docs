import { describe, expect, it } from "vitest";

import { dividirEmPaginas } from "@/lib/paginar";

describe("dividirEmPaginas", () => {
  it("começa uma folha nova a cada seção", () => {
    const folhas = dividirEmPaginas(
      "<h2>Primeira</h2><p>a</p><h2>Segunda</h2><p>b</p><h2>Terceira</h2><p>c</p>",
    );

    expect(folhas).toHaveLength(3);
    expect(folhas[0]).toContain("Primeira");
    expect(folhas[1]).toContain("Segunda");
    expect(folhas[2]).toContain("Terceira");
  });

  it("mantém junto o texto que vem antes da primeira seção", () => {
    const folhas = dividirEmPaginas("<p>introdução</p><h2>Seção</h2><p>corpo</p>");

    expect(folhas).toHaveLength(1);
    expect(folhas[0]).toContain("introdução");
  });

  it("não parte uma lista no meio", () => {
    const itens = Array.from({ length: 40 }, (_, i) => `<li>item ${i}</li>`).join("");
    const folhas = dividirEmPaginas(`<ul>${itens}</ul>`);

    // A lista inteira é um bloco só: ou está inteira em uma folha, ou
    // não está. Nunca com a tag aberta em uma e fechada em outra.
    for (const folha of folhas) {
      const aberturas = folha.match(/<ul/g)?.length ?? 0;
      const fechamentos = folha.match(/<\/ul>/g)?.length ?? 0;
      expect(aberturas).toBe(fechamentos);
    }
  });

  it("não parte uma tabela no meio", () => {
    const linhas = Array.from(
      { length: 30 },
      (_, i) => `<tr><td>linha ${i}</td></tr>`,
    ).join("");

    const folhas = dividirEmPaginas(`<table><tbody>${linhas}</tbody></table>`);

    for (const folha of folhas) {
      const aberturas = folha.match(/<table/g)?.length ?? 0;
      const fechamentos = folha.match(/<\/table>/g)?.length ?? 0;
      expect(aberturas).toBe(fechamentos);
    }
  });

  it("quebra documento sem seções por volume de conteúdo", () => {
    const paragrafos = Array.from({ length: 40 }, (_, i) => `<p>parágrafo ${i}</p>`).join(
      "",
    );

    const folhas = dividirEmPaginas(paragrafos);

    expect(folhas.length).toBeGreaterThan(1);
    expect(folhas.join("")).toContain("parágrafo 39");
  });

  it("não perde conteúdo ao dividir", () => {
    const original = "<h2>A</h2><p>um</p><h2>B</h2><ul><li>dois</li></ul>";
    const folhas = dividirEmPaginas(original);

    expect(folhas.join("")).toBe(original);
  });

  it("devolve uma folha vazia quando não há conteúdo", () => {
    expect(dividirEmPaginas("")).toEqual([""]);
  });

  it("tolera fechamento de tag sem abertura", () => {
    const folhas = dividirEmPaginas("<p>ok</p></div><p>segue</p>");

    expect(folhas.join("")).toContain("segue");
  });
});
