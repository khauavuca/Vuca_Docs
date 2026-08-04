/**
 * Divisão do documento em páginas.
 *
 * Todo documento da base é exibido em folhas, e não em uma rolagem
 * contínua. A quebra acompanha a estrutura do texto: cada seção começa
 * em uma folha nova, como em um manual impresso.
 */

const BLOCOS_POR_FOLHA = 14;

/** Tags que não têm fechamento e por isso não alteram a profundidade. */
const TAGS_SEM_FECHAMENTO = new Set([
  "br",
  "hr",
  "img",
  "input",
  "col",
  "source",
  "area",
  "base",
  "meta",
  "link",
]);

/**
 * Separa os blocos do primeiro nível do conteúdo.
 *
 * Percorre as tags contando a profundidade, para que uma lista ou uma
 * tabela sejam tratadas como um bloco só. Cortar por posição de texto
 * partiria essas estruturas no meio e devolveria HTML quebrado.
 */
function separarBlocosDeTopo(html: string): string[] {
  const blocos: string[] = [];
  const tags = /<(\/?)([a-zA-Z0-9]+)[^>]*?(\/?)>/g;

  let profundidade = 0;
  let inicio = 0;
  let correspondencia: RegExpExecArray | null;

  while ((correspondencia = tags.exec(html)) !== null) {
    const [texto, barraInicial, nomeDaTag, barraFinal] = correspondencia;
    const nome = nomeDaTag.toLowerCase();

    if (TAGS_SEM_FECHAMENTO.has(nome) || barraFinal === "/") continue;

    if (barraInicial === "/") {
      profundidade -= 1;

      if (profundidade === 0) {
        const fim = correspondencia.index + texto.length;
        blocos.push(html.slice(inicio, fim));
        inicio = fim;
      }

      // Fechamento sem abertura correspondente: não deixa o contador negativo.
      if (profundidade < 0) profundidade = 0;
      continue;
    }

    profundidade += 1;
  }

  const resto = html.slice(inicio).trim();
  if (resto) blocos.push(resto);

  return blocos.filter((bloco) => bloco.trim());
}

/** Quebra o conteúdo em folhas, uma por seção de segundo nível. */
export function dividirEmPaginas(html: string): string[] {
  const conteudo = html.trim();
  if (!conteudo) return [""];

  const blocos = separarBlocosDeTopo(conteudo);

  // Caminho normal: cada seção do documento começa em uma folha nova.
  const temSecoes = /<h2[\s>]/i.test(conteudo);

  if (temSecoes) {
    const folhas: string[] = [];
    let atual = "";
    let jaAbriuSecao = false;

    for (const bloco of blocos) {
      const abreSecao = /^\s*<h2[\s>]/i.test(bloco);

      // O texto que vem antes da primeira seção acompanha ela. Sozinho,
      // ocuparia uma folha inteira com duas linhas.
      if (abreSecao && jaAbriuSecao && atual.trim()) {
        folhas.push(atual);
        atual = "";
      }

      if (abreSecao) jaAbriuSecao = true;
      atual += bloco;
    }

    if (atual.trim()) folhas.push(atual);
    return folhas.length > 0 ? folhas : [conteudo];
  }

  // Documento sem seções: quebra por volume, para não virar uma folha
  // sem fim. É o caso comum de conteúdo importado sem hierarquia.
  if (blocos.length <= BLOCOS_POR_FOLHA) return [conteudo];

  const folhas: string[] = [];
  for (let i = 0; i < blocos.length; i += BLOCOS_POR_FOLHA) {
    folhas.push(blocos.slice(i, i + BLOCOS_POR_FOLHA).join(""));
  }

  return folhas;
}
