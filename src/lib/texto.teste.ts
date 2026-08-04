import { describe, expect, it } from "vitest";

import {
  gerarSlug,
  htmlParaTexto,
  normalizar,
  partirPorTermo,
  tempoDeLeitura,
  trechoComTermo,
} from "@/lib/texto";

describe("normalizar", () => {
  it("tira acento e caixa, que é o que faz a busca funcionar", () => {
    expect(normalizar("Sincronização")).toBe("sincronizacao");
    expect(normalizar("CONFIGURAÇÃO de Balança")).toBe("configuracao de balanca");
  });
});

describe("gerarSlug", () => {
  it("monta endereço legível a partir do título", () => {
    expect(gerarSlug("Configurar impressora não fiscal")).toBe(
      "configurar-impressora-nao-fiscal",
    );
  });

  it("descarta pontuação e espaços repetidos", () => {
    expect(gerarSlug("  Erro: 500 -- servidor  ")).toBe("erro-500-servidor");
  });

  it("nunca devolve endereço vazio", () => {
    expect(gerarSlug("!!!")).toBe("sem-titulo");
  });
});

describe("htmlParaTexto", () => {
  it("separa os blocos com espaço em vez de grudar as palavras", () => {
    expect(htmlParaTexto("<p>primeiro</p><p>segundo</p>")).toBe("primeiro segundo");
  });

  it("descarta script e estilo", () => {
    expect(htmlParaTexto("<p>ok</p><script>roubar()</script>")).toBe("ok");
  });

  it("traduz as entidades mais comuns", () => {
    expect(htmlParaTexto("<p>a &amp; b</p>")).toBe("a & b");
  });
});

describe("trechoComTermo", () => {
  it("recorta em volta do termo encontrado", () => {
    const texto = `${"palavra ".repeat(60)}impressora ${"outra ".repeat(60)}`;
    const trecho = trechoComTermo(texto, "impressora");

    expect(trecho).toContain("impressora");
    expect(trecho.length).toBeLessThan(texto.length);
  });

  it("devolve o começo quando o termo não aparece", () => {
    expect(trechoComTermo("texto curto", "inexistente")).toBe("texto curto");
  });
});

describe("partirPorTermo", () => {
  it("marca o trecho procurado ignorando acento", () => {
    const pedacos = partirPorTermo("Erro de sincronização", "sincronizacao");
    const destacado = pedacos.filter((pedaco) => pedaco.destacado);

    expect(destacado).toHaveLength(1);
    expect(destacado[0].texto).toBe("sincronização");
  });

  it("marca todas as ocorrências", () => {
    const pedacos = partirPorTermo("balança e balança", "balança");

    expect(pedacos.filter((pedaco) => pedaco.destacado)).toHaveLength(2);
  });

  it("preserva o texto original ao juntar de volta", () => {
    const original = "Configuração da balança digital";
    const pedacos = partirPorTermo(original, "balanca");

    expect(pedacos.map((pedaco) => pedaco.texto).join("")).toBe(original);
  });

  it("não destaca nada quando não há termo", () => {
    const pedacos = partirPorTermo("qualquer coisa", "");

    expect(pedacos).toHaveLength(1);
    expect(pedacos[0].destacado).toBe(false);
  });
});

describe("tempoDeLeitura", () => {
  it("nunca devolve menos de um minuto", () => {
    expect(tempoDeLeitura("três palavras aqui")).toBe(1);
  });

  it("cresce junto com o texto", () => {
    const texto = "palavra ".repeat(600);
    expect(tempoDeLeitura(texto)).toBe(3);
  });
});
