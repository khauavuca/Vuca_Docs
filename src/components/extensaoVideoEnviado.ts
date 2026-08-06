import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Vídeo enviado como arquivo, guardado no balde privado.
 *
 * Ao contrário do vídeo do Drive, o endereço aponta pra nossa própria
 * rota autenticada (/api/anexos/{id}) — por isso pode ficar salvo direto
 * no HTML, igual a uma imagem, sem precisar reconstruir na hora da
 * leitura como o iframe externo precisa.
 */
export const VideoEnviado = Node.create({
  name: "videoEnviado",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (elemento: HTMLElement) => elemento.getAttribute("src"),
        renderHTML: (atributos: { src?: string | null }) =>
          atributos.src ? { src: atributos.src } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: "true",
        class: "aspect-video w-full rounded-lg border border-slate-200 bg-black",
      }),
    ];
  },
});
