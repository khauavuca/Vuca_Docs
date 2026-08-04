import { describe, expect, it } from "vitest";

import { enderecoDeVideoDoDrive, limparConteudo } from "@/lib/sanitizar";

describe("limparConteudo", () => {
  it("preserva a formatação que o editor produz", () => {
    const original =
      "<h2>Configurar balança</h2><p><strong>Passo 1</strong></p><ul><li>Abrir</li></ul><table><tr><td>a</td></tr></table>";

    const limpo = limparConteudo(original);

    expect(limpo).toContain("<h2>Configurar balança</h2>");
    expect(limpo).toContain("<strong>Passo 1</strong>");
    expect(limpo).toContain("<li>Abrir</li>");
    expect(limpo).toContain("<td>a</td>");
  });

  it("remove script embutido no conteúdo", () => {
    const limpo = limparConteudo('<p>ok</p><script>alert("roubo de sessão")</script>');

    expect(limpo).toContain("<p>ok</p>");
    expect(limpo).not.toContain("script");
    expect(limpo).not.toContain("alert");
  });

  it("remove tratador de evento colado em uma tag válida", () => {
    const limpo = limparConteudo('<p onclick="roubar()">texto</p>');

    expect(limpo).toContain("texto");
    expect(limpo).not.toContain("onclick");
  });

  it("aceita imagem servida pela própria plataforma", () => {
    const limpo = limparConteudo('<p><img src="/api/anexos/abc123" alt="print" /></p>');

    expect(limpo).toContain('src="/api/anexos/abc123"');
  });

  it("esvazia imagem apontada para fora da plataforma", () => {
    // Imagem externa vazaria para outro servidor quem está lendo, e
    // continuaria acessível a quem não tem sessão.
    const limpo = limparConteudo('<img src="https://exemplo.com/rastreador.png" />');

    expect(limpo).not.toContain("exemplo.com");
  });

  it("remove endereço com esquema perigoso em link", () => {
    const limpo = limparConteudo('<a href="javascript:alert(1)">clique</a>');

    expect(limpo).not.toContain("javascript:");
  });

  it("mantém o marcador de vídeo, mas nunca o iframe gravado", () => {
    const limpo = limparConteudo(
      '<div data-video-url="https://drive.google.com/file/d/abc/preview"><iframe src="https://drive.google.com/file/d/abc/preview"></iframe></div>',
    );

    expect(limpo).toContain("data-video-url");
    expect(limpo).not.toContain("<iframe");
  });
});

describe("enderecoDeVideoDoDrive", () => {
  it("aceita o endereço de compartilhamento do Drive", () => {
    expect(
      enderecoDeVideoDoDrive("https://drive.google.com/file/d/ABC123/view?usp=sharing"),
    ).toBe("https://drive.google.com/file/d/ABC123/preview");
  });

  it("aceita o endereço com identificador na consulta", () => {
    expect(enderecoDeVideoDoDrive("https://drive.google.com/open?id=XYZ789")).toBe(
      "https://drive.google.com/file/d/XYZ789/preview",
    );
  });

  it("recusa vídeo hospedado em outro serviço", () => {
    expect(enderecoDeVideoDoDrive("https://www.youtube.com/watch?v=123")).toBeNull();
  });

  it("recusa texto que não é endereço", () => {
    expect(enderecoDeVideoDoDrive("drive.google.com/file/d/ABC")).toBeNull();
  });
});
