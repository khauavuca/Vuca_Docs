import { describe, expect, it } from "vitest";

import { estruturarTextoSolto } from "@/lib/textoEstruturado";

describe("estruturarTextoSolto", () => {
  it("transforma seção numerada em título", () => {
    expect(estruturarTextoSolto("1. Acesso ao portal")).toBe(
      "<h2>1. Acesso ao portal</h2>",
    );
  });

  it("usa subtítulo quando a numeração tem dois níveis", () => {
    expect(estruturarTextoSolto("1.2 Coletar o token")).toBe(
      "<h3>1.2 Coletar o token</h3>",
    );
  });

  it("reconhece título escrito em caixa alta", () => {
    expect(estruturarTextoSolto("PARTE 1")).toBe("<h2>PARTE 1</h2>");
  });

  it("agrupa linhas seguidas no mesmo parágrafo", () => {
    const html = estruturarTextoSolto("primeira linha\nsegunda linha");

    expect(html).toBe("<p>primeira linha segunda linha</p>");
  });

  it("separa parágrafos na linha em branco", () => {
    const html = estruturarTextoSolto("um\n\ndois");

    expect(html).toBe("<p>um</p><p>dois</p>");
  });

  it("monta lista a partir de marcadores", () => {
    const html = estruturarTextoSolto("- café\n- açúcar");

    expect(html).toBe("<ul><li>café</li><li>açúcar</li></ul>");
  });

  it("escapa o que poderia virar marcação", () => {
    const html = estruturarTextoSolto('texto com <script>alert("x")</script>');

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("devolve vazio para texto vazio", () => {
    expect(estruturarTextoSolto("")).toBe("");
  });
});
