import { gerarSlug, htmlParaTexto } from "@/lib/texto";

export type ItemDoSumario = { id: string; texto: string; nivel: 1 | 2 | 3 };

/**
 * Percorre os títulos do artigo, garante um identificador em cada um e
 * devolve a lista para montar o sumário lateral.
 */
export function prepararSumario(html: string): {
  html: string;
  itens: ItemDoSumario[];
} {
  const itens: ItemDoSumario[] = [];
  const usados = new Set<string>();

  const htmlComAncoras = html.replace(
    /<h([123])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_correspondencia, nivel: string, atributos: string, conteudo: string) => {
      const texto = htmlParaTexto(conteudo);
      if (!texto) return `<h${nivel}${atributos}>${conteudo}</h${nivel}>`;

      let id = gerarSlug(texto);
      let contador = 2;
      while (usados.has(id)) {
        id = `${gerarSlug(texto)}-${contador}`;
        contador += 1;
      }
      usados.add(id);

      itens.push({ id, texto, nivel: Number(nivel) as 1 | 2 | 3 });

      const atributosSemId = atributos.replace(/\sid="[^"]*"/gi, "");
      return `<h${nivel}${atributosSemId} id="${id}">${conteudo}</h${nivel}>`;
    },
  );

  return { html: htmlComAncoras, itens };
}
