/**
 * Reconstrução de estrutura a partir de texto solto.
 *
 * Usado na importação de PDF, onde não existe título nem lista, apenas
 * letras posicionadas na página. A hierarquia é deduzida de convenções
 * de escrita que todo manual segue.
 */

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ehTituloNumerado = (linha: string) =>
  /^\d+(\.\d+)*[.)]?\s+\S/.test(linha) && linha.length <= 90;

const ehTituloEmCaixaAlta = (linha: string) =>
  linha.length >= 4 &&
  linha.length <= 70 &&
  linha === linha.toUpperCase() &&
  /[A-ZÀ-Ú]/.test(linha);

const ehItemDeLista = (linha: string) => /^[-•*·]\s+\S/.test(linha);

/** Converte o texto solto em conteúdo com seções, listas e parágrafos. */
export function estruturarTextoSolto(texto: string): string {
  const linhas = texto
    .split(/\r?\n/)
    .map((linha) => linha.replace(/\s+/g, " ").trim());

  const partes: string[] = [];
  let paragrafo: string[] = [];
  let lista: string[] = [];

  const fecharParagrafo = () => {
    if (paragrafo.length > 0) {
      partes.push(`<p>${escapar(paragrafo.join(" "))}</p>`);
      paragrafo = [];
    }
  };

  const fecharLista = () => {
    if (lista.length > 0) {
      partes.push(`<ul>${lista.map((item) => `<li>${escapar(item)}</li>`).join("")}</ul>`);
      lista = [];
    }
  };

  for (const linha of linhas) {
    if (!linha) {
      fecharParagrafo();
      fecharLista();
      continue;
    }

    if (ehItemDeLista(linha)) {
      fecharParagrafo();
      lista.push(linha.replace(/^[-•*·]\s+/, ""));
      continue;
    }

    fecharLista();

    if (ehTituloNumerado(linha)) {
      fecharParagrafo();
      const nivel = (linha.match(/^\d+(\.\d+)*/)?.[0].split(".").length ?? 1) > 1 ? 3 : 2;
      partes.push(`<h${nivel}>${escapar(linha)}</h${nivel}>`);
      continue;
    }

    if (ehTituloEmCaixaAlta(linha)) {
      fecharParagrafo();
      partes.push(`<h2>${escapar(linha)}</h2>`);
      continue;
    }

    paragrafo.push(linha);
  }

  fecharParagrafo();
  fecharLista();

  return partes.join("");
}
