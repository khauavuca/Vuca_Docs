import sanitizeHtml from "sanitize-html";

/**
 * O conteúdo do editor é gravado como HTML. Como qualquer HTML vindo do
 * navegador é dado não confiável, ele passa por limpeza antes de ser
 * gravado. Isso fecha a porta para script injetado no artigo, que rodaria
 * na sessão de quem apenas está lendo.
 */
export function limparConteudo(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "hr", "blockquote", "pre", "code", "span", "div", "label", "mark",
      "h1", "h2", "h3", "h4",
      "ul", "ol", "li", "input",
      "strong", "em", "s", "u",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      div: ["data-video", "data-video-url"],
      span: ["class", "style", "data-comentario-id"],
      code: ["class"],
      pre: ["class"],
      mark: ["style"],
      // Alinhamento, recuo, espaçamento e cor de texto/fonte são os únicos
      // usos de atributo de estilo ou de formulário que o editor produz.
      p: ["style", "data-indent", "data-line-height"],
      h1: ["style", "data-indent", "data-line-height"],
      h2: ["style", "data-indent", "data-line-height"],
      h3: ["style", "data-indent", "data-line-height"],
      h4: ["style", "data-indent", "data-line-height"],
      ul: ["data-type"],
      li: ["data-type", "data-checked"],
      input: ["type", "checked", "disabled"],
    },
    // Cor e fonte não são configuráveis por documento de propósito — o
    // padrão visual é da plataforma. Aqui elas só existem no nível de
    // texto selecionado (negrito ainda vale mais que a fonte do doc
    // inteiro), e cada propriedade tem um formato fechado: não dá pra
    // passar nada além de uma cor hexadecimal, um nome de fonte da lista
    // do editor ou um tamanho numérico.
    allowedStyles: {
      "*": {
        "text-align": [/^left$/, /^center$/, /^right$/, /^justify$/],
      },
      span: {
        color: [/^#[0-9a-fA-F]{6}$/],
        "font-family": [/^[A-Za-z0-9 ,'"-]+$/],
        "font-size": [/^\d{1,3}(\.\d+)?(px|pt)$/],
      },
      mark: {
        "background-color": [/^#[0-9a-fA-F]{6}$/],
        color: [/^inherit$/],
      },
    },
    allowedSchemes: ["https", "mailto"],
    // Imagens só podem apontar para a rota autenticada da própria aplicação.
    allowedSchemesByTag: { img: [] },
    transformTags: {
      a: (nomeTag, atributos) => ({
        tagName: "a",
        attribs: { ...atributos, target: "_blank", rel: "noopener noreferrer" },
      }),
      img: (nomeTag, atributos) => {
        const origem = atributos.src ?? "";
        return {
          tagName: "img",
          attribs: origem.startsWith("/api/anexos/")
            ? atributos
            : { ...atributos, src: "" },
        };
      },
    },
  });
}

/**
 * Aceita apenas endereços de vídeo do Google Drive e devolve o endereço
 * de exibição. Qualquer outro endereço é recusado.
 */
export function enderecoDeVideoDoDrive(url: string): string | null {
  try {
    const endereco = new URL(url.trim());
    if (endereco.hostname !== "drive.google.com") return null;

    const porCaminho = endereco.pathname.match(/\/file\/d\/([^/]+)/);
    const identificador = porCaminho?.[1] ?? endereco.searchParams.get("id");
    if (!identificador) return null;

    return `https://drive.google.com/file/d/${identificador}/preview`;
  } catch {
    return null;
  }
}
