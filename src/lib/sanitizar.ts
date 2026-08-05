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
      "p", "br", "hr", "blockquote", "pre", "code", "span", "div", "label",
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
      span: ["class"],
      code: ["class"],
      pre: ["class"],
      // Alinhamento e lista de tarefas, os dois únicos usos de atributo
      // de estilo ou de formulário que o editor produz.
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      ul: ["data-type"],
      li: ["data-type", "data-checked"],
      input: ["type", "checked", "disabled"],
    },
    // Só o alinhamento de texto pode vir por estilo — nenhuma outra
    // propriedade CSS passa por aqui. Cor e fonte não são configuráveis
    // por documento de propósito: o padrão visual é da plataforma.
    allowedStyles: {
      "*": {
        "text-align": [/^left$/, /^center$/, /^right$/, /^justify$/],
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
