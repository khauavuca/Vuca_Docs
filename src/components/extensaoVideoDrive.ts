import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Vídeo do Google Drive dentro do artigo.
 *
 * O que é gravado no banco é apenas <div data-video-url="…">. O iframe
 * existe no editor e na leitura, mas nunca no conteúdo salvo, o que
 * mantém a limpeza do HTML estrita no servidor.
 */
export const VideoDoDrive = Node.create({
  name: "videoDoDrive",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      url: {
        default: null,
        parseHTML: (elemento) => elemento.getAttribute("data-video-url"),
        renderHTML: (atributos) =>
          atributos.url ? { "data-video-url": atributos.url } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-video-url]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const url = HTMLAttributes["data-video-url"];

    return [
      "div",
      mergeAttributes({ "data-video-url": url, class: "video-do-drive" }),
      [
        "iframe",
        {
          src: url,
          allow: "autoplay; fullscreen",
          allowfullscreen: "true",
          class: "aspect-video w-full rounded-lg border border-slate-200",
        },
      ],
    ];
  },
});
