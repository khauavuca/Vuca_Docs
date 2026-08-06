import { Extension, Mark, mergeAttributes } from "@tiptap/core";

/**
 * Marca o trecho comentado no texto. Só guarda o id — o conteúdo do
 * comentário (texto, respostas, resolvido) mora no banco, não no HTML,
 * porque precisa ser editável sem gerar uma nova versão do documento.
 */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comentario: {
      marcarComentario: (id: string) => ReturnType;
    };
  }
}

export const MarcaDeComentario = Mark.create({
  name: "comentario",
  addAttributes() {
    return {
      comentarioId: {
        default: null,
        parseHTML: (elemento: HTMLElement) => elemento.getAttribute("data-comentario-id"),
        renderHTML: (atributos: { comentarioId?: string | null }) => {
          if (!atributos.comentarioId) return {};
          return { "data-comentario-id": atributos.comentarioId };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-comentario-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "marca-de-comentario" }), 0];
  },
  addCommands() {
    return {
      marcarComentario:
        (id: string) =>
        ({ chain }) =>
          chain().setMark(this.name, { comentarioId: id }).run(),
    };
  },
});

/**
 * Recuo de parágrafo e título fora de lista. Dentro de lista o recuo já
 * existe pronto (sinkListItem/liftListItem, do ListItem do StarterKit) —
 * esta extensão cobre o caso que faltava, texto solto sem lista.
 */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indentacao: {
      aumentarRecuo: () => ReturnType;
      diminuirRecuo: () => ReturnType;
    };
  }
}

export const Indentacao = Extension.create({
  name: "indentacao",
  addOptions() {
    return { types: ["paragraph", "heading"], passo: 2, maximo: 8 };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indentacao: {
            default: 0,
            parseHTML: (elemento: HTMLElement) => {
              const valor = elemento.getAttribute("data-indent");
              return valor ? Number(valor) : 0;
            },
            renderHTML: (atributos: { indentacao?: number }) => {
              if (!atributos.indentacao) return {};
              return { "data-indent": String(atributos.indentacao) };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    const { types, passo, maximo } = this.options;

    return {
      aumentarRecuo:
        () =>
        ({ editor, chain }) => {
          const tipoAtivo = types.find((tipo: string) => editor.isActive(tipo));
          if (!tipoAtivo) return false;
          const atual = editor.getAttributes(tipoAtivo).indentacao ?? 0;
          return chain()
            .updateAttributes(tipoAtivo, { indentacao: Math.min(atual + passo, maximo) })
            .run();
        },
      diminuirRecuo:
        () =>
        ({ editor, chain }) => {
          const tipoAtivo = types.find((tipo: string) => editor.isActive(tipo));
          if (!tipoAtivo) return false;
          const atual = editor.getAttributes(tipoAtivo).indentacao ?? 0;
          return chain()
            .updateAttributes(tipoAtivo, { indentacao: Math.max(atual - passo, 0) })
            .run();
        },
    };
  },
});

/**
 * Espaçamento entre linhas do parágrafo ou título — igual ao "espaçamento
 * entre linhas e parágrafo" do Word Web, só que como atributo em vez de
 * estilo livre, pra não abrir a porta pra qualquer CSS.
 */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    espacamentoDeLinha: {
      definirEspacamentoDeLinha: (valor: string) => ReturnType;
    };
  }
}

export const EspacamentoDeLinha = Extension.create({
  name: "espacamentoDeLinha",
  addOptions() {
    return { types: ["paragraph", "heading"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          espacamentoDeLinha: {
            default: null,
            parseHTML: (elemento: HTMLElement) => elemento.getAttribute("data-line-height"),
            renderHTML: (atributos: { espacamentoDeLinha?: string | null }) => {
              if (!atributos.espacamentoDeLinha) return {};
              return { "data-line-height": atributos.espacamentoDeLinha };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    const { types } = this.options;

    return {
      definirEspacamentoDeLinha:
        (valor: string) =>
        ({ editor, chain }) => {
          const tipoAtivo = types.find((tipo: string) => editor.isActive(tipo)) ?? "paragraph";
          return chain().updateAttributes(tipoAtivo, { espacamentoDeLinha: valor }).run();
        },
    };
  },
});

/**
 * Tamanho de fonte. Cor e família de fonte já têm extensão oficial da
 * Tiptap (Color, FontFamily); tamanho não tem, então segue o mesmo padrão
 * delas: atributo global na marca "textStyle".
 */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      definirTamanhoDeFonte: (tamanho: string) => ReturnType;
      removerTamanhoDeFonte: () => ReturnType;
    };
  }
}

export const TamanhoDeFonte = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (elemento: HTMLElement) => elemento.style.fontSize || null,
            renderHTML: (atributos: { fontSize?: string | null }) => {
              if (!atributos.fontSize) return {};
              return { style: `font-size: ${atributos.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      definirTamanhoDeFonte:
        (tamanho: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: tamanho }).run(),
      removerTamanhoDeFonte:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).run(),
    };
  },
});
