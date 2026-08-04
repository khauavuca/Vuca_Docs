/**
 * Comparação entre duas versões de um documento.
 *
 * A comparação é feita por bloco de texto, não por letra. Para quem
 * revisa, o que importa é enxergar qual parágrafo entrou, saiu ou
 * continua igual, e não a diferença caractere a caractere.
 */

export type LinhaComparada = {
  tipo: "igual" | "removido" | "adicionado";
  texto: string;
};

/** Quebra o conteúdo do editor em blocos de texto legíveis. */
export function extrairBlocos(html: string): string[] {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|blockquote|pre|tr|div|td|th)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .split("\n")
    .map((bloco) => bloco.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Encontra a maior sequência de blocos em comum entre as duas versões e
 * usa isso para separar o que permaneceu do que mudou.
 */
export function compararBlocos(antes: string[], depois: string[]): LinhaComparada[] {
  const linhas = antes.length;
  const colunas = depois.length;

  // Tabela da maior subsequência comum.
  const tabela: number[][] = Array.from({ length: linhas + 1 }, () =>
    new Array<number>(colunas + 1).fill(0),
  );

  for (let i = linhas - 1; i >= 0; i -= 1) {
    for (let j = colunas - 1; j >= 0; j -= 1) {
      tabela[i][j] =
        antes[i] === depois[j]
          ? tabela[i + 1][j + 1] + 1
          : Math.max(tabela[i + 1][j], tabela[i][j + 1]);
    }
  }

  const resultado: LinhaComparada[] = [];
  let i = 0;
  let j = 0;

  while (i < linhas && j < colunas) {
    if (antes[i] === depois[j]) {
      resultado.push({ tipo: "igual", texto: antes[i] });
      i += 1;
      j += 1;
    } else if (tabela[i + 1][j] >= tabela[i][j + 1]) {
      resultado.push({ tipo: "removido", texto: antes[i] });
      i += 1;
    } else {
      resultado.push({ tipo: "adicionado", texto: depois[j] });
      j += 1;
    }
  }

  while (i < linhas) {
    resultado.push({ tipo: "removido", texto: antes[i] });
    i += 1;
  }

  while (j < colunas) {
    resultado.push({ tipo: "adicionado", texto: depois[j] });
    j += 1;
  }

  return resultado;
}

export function contarMudancas(linhas: LinhaComparada[]) {
  return {
    adicionados: linhas.filter((linha) => linha.tipo === "adicionado").length,
    removidos: linhas.filter((linha) => linha.tipo === "removido").length,
  };
}
