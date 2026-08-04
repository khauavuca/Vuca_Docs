/**
 * Remove acentos e coloca em minúsculas.
 * É o que permite encontrar "sincronizacao" ao digitar "sincronização".
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .trim();
}

/** Gera o endereço do artigo a partir do título. */
export function gerarSlug(texto: string): string {
  const base = normalizar(texto)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base || "sem-titulo";
}

/** Converte o conteúdo do editor em texto puro, para busca e prévia. */
export function htmlParaTexto(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Tempo estimado de leitura, com base em 200 palavras por minuto. */
export function tempoDeLeitura(texto: string): number {
  const palavras = texto.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}

/**
 * Divide o texto em pedaços, marcando os que combinam com o que foi
 * procurado. Serve para destacar o termo no resultado da busca sem
 * precisar montar HTML na mão.
 */
export function partirPorTermo(
  texto: string,
  termo: string,
): Array<{ texto: string; destacado: boolean }> {
  const palavras = normalizar(termo)
    .split(/\s+/)
    .filter((palavra) => palavra.length > 1);

  if (palavras.length === 0 || !texto) return [{ texto, destacado: false }];

  // A normalização preserva a posição de cada letra, então dá para marcar
  // os trechos no texto normalizado e recortar o original pelos índices.
  const alvo = normalizar(texto);
  const marcados = new Array<boolean>(texto.length).fill(false);

  for (const palavra of palavras) {
    let posicao = alvo.indexOf(palavra);
    while (posicao >= 0) {
      for (let i = posicao; i < posicao + palavra.length && i < marcados.length; i += 1) {
        marcados[i] = true;
      }
      posicao = alvo.indexOf(palavra, posicao + palavra.length);
    }
  }

  const pedacos: Array<{ texto: string; destacado: boolean }> = [];
  let inicio = 0;

  for (let i = 1; i <= texto.length; i += 1) {
    if (i === texto.length || marcados[i] !== marcados[inicio]) {
      pedacos.push({ texto: texto.slice(inicio, i), destacado: marcados[inicio] });
      inicio = i;
    }
  }

  return pedacos;
}

/**
 * Devolve o trecho em volta do termo procurado, para exibir no resultado
 * da busca. Quando o termo não aparece, devolve o começo do texto.
 */
export function trechoComTermo(texto: string, termo: string, tamanho = 220): string {
  if (!texto) return "";

  const posicao = normalizar(texto).indexOf(normalizar(termo));
  if (posicao < 0) {
    return texto.length > tamanho ? `${texto.slice(0, tamanho).trimEnd()}…` : texto;
  }

  const inicio = Math.max(0, posicao - Math.floor(tamanho / 3));
  const fim = Math.min(texto.length, inicio + tamanho);
  const prefixo = inicio > 0 ? "…" : "";
  const sufixo = fim < texto.length ? "…" : "";

  return `${prefixo}${texto.slice(inicio, fim).trim()}${sufixo}`;
}
