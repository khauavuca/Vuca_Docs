import { inflateSync } from "node:zlib";

import { PDFDict, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { PNG } from "pngjs";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Leitura de PDF.
 *
 * O PDF guarda posição de letra na página, não estrutura de documento.
 * O texto é recuperado aqui e estruturado em outro módulo. As figuras
 * são extraídas à parte, porque no PDF elas não têm vínculo com o
 * parágrafo em que aparecem.
 *
 * A extração padrão segue a ordem em que o texto foi desenhado no
 * arquivo — o que basta para um Word exportado, mas quebra em
 * ferramentas de cartão/slide (Gamma, Canva, Figma), que posicionam
 * texto livremente na página sem relação com essa ordem de desenho.
 * Por isso a posição (x, y) de cada trecho é usada para reconstruir a
 * ordem visual de leitura: de cima para baixo, da esquerda para a
 * direita — o mesmo raciocínio de quem olha a página.
 */

/** Agrupa itens de texto em linhas, por proximidade vertical. */
export function reconstruirOrdemDeLeitura(
  itens: Array<{ str: string; transform: number[] }>,
): string {
  const TOLERANCIA_DE_LINHA = 4;

  const posicionados = itens
    .filter((item) => item.str.trim().length > 0)
    .map((item) => ({
      texto: item.str,
      x: item.transform[4],
      y: item.transform[5],
    }))
    // Só ordena por y aqui. Duas letras da mesma linha visual quase
    // nunca têm y idêntico — a diferença de fração de ponto é normal
    // —, então desempatar por x só quando o y bate exatamente nunca
    // disparava. A ordem da esquerda para a direita é resolvida depois,
    // dentro de cada linha já agrupada.
    .sort((a, b) => b.y - a.y);

  const linhas: Array<{ y: number; itens: typeof posicionados }> = [];
  let linhaAtual: { y: number; itens: typeof posicionados } | null = null;

  for (const item of posicionados) {
    if (linhaAtual && Math.abs(linhaAtual.y - item.y) <= TOLERANCIA_DE_LINHA) {
      linhaAtual.itens.push(item);
      continue;
    }

    if (linhaAtual) linhas.push(linhaAtual);
    linhaAtual = { y: item.y, itens: [item] };
  }

  if (linhaAtual) linhas.push(linhaAtual);

  return linhas
    .map((linha) =>
      linha.itens
        .sort((a, b) => a.x - b.x)
        .map((item) => item.texto)
        .join(" "),
    )
    .join("\n");
}

/**
 * Uma linha curta que se repete na maioria das páginas é rodapé ou
 * marca d'água — o nome da ferramenta usada para criar o arquivo, a
 * data, a numeração —, nunca um passo do procedimento. Um parágrafo
 * de conteúdo repetir por acaso em tantas páginas é praticamente
 * impossível, o que torna esse corte seguro.
 */
export function removerLinhasRepetidas(paginas: string[]): string[] {
  if (paginas.length < 3) return paginas;

  const contagem = new Map<string, number>();

  for (const pagina of paginas) {
    const linhasUnicas = new Set(
      pagina
        .split("\n")
        .map((linha) => linha.trim())
        .filter(Boolean),
    );
    for (const linha of linhasUnicas) {
      contagem.set(linha, (contagem.get(linha) ?? 0) + 1);
    }
  }

  const limite = Math.ceil(paginas.length * 0.6);
  const repetidas = new Set(
    [...contagem.entries()]
      .filter(([linha, vezes]) => vezes >= limite && linha.length <= 60)
      .map(([linha]) => linha),
  );

  if (repetidas.size === 0) return paginas;

  return paginas.map((pagina) =>
    pagina
      .split("\n")
      .filter((linha) => !repetidas.has(linha.trim()))
      .join("\n"),
  );
}

export async function extrairTextoDoPdf(arquivo: ArrayBuffer): Promise<string> {
  const porPagina: string[] = [];

  await pdfParse(Buffer.from(arquivo), {
    pagerender: async (pagina) => {
      const conteudo = await pagina.getTextContent();
      const texto = reconstruirOrdemDeLeitura(conteudo.items);
      porPagina.push(texto);
      return texto;
    },
  });

  return removerLinhasRepetidas(porPagina).join("\n\n");
}

export type FiguraDoPdf = {
  conteudo: ArrayBuffer;
  tipoMime: string;
};

function numeroDoDicionario(dicionario: PDFDict, chave: string): number {
  const valor = dicionario.get(PDFName.of(chave));
  return valor ? Number(valor.toString()) : 0;
}

function nomeDoFiltro(dicionario: PDFDict): string {
  return dicionario.get(PDFName.of("Filter"))?.toString() ?? "";
}

/** Monta um PNG a partir dos bytes crus de uma imagem do PDF. */
function montarPng(
  bytes: Buffer,
  largura: number,
  altura: number,
  canais: number,
): ArrayBuffer | null {
  if (largura <= 0 || altura <= 0) return null;
  if (bytes.length < largura * altura * canais) return null;

  const png = new PNG({ width: largura, height: altura });

  for (let posicao = 0; posicao < largura * altura; posicao += 1) {
    const origem = posicao * canais;
    const destino = posicao * 4;

    if (canais === 1) {
      const tom = bytes[origem];
      png.data[destino] = tom;
      png.data[destino + 1] = tom;
      png.data[destino + 2] = tom;
    } else {
      png.data[destino] = bytes[origem];
      png.data[destino + 1] = bytes[origem + 1];
      png.data[destino + 2] = bytes[origem + 2];
    }

    png.data[destino + 3] = 255;
  }

  const resultado = PNG.sync.write(png);
  return resultado.buffer.slice(
    resultado.byteOffset,
    resultado.byteOffset + resultado.byteLength,
  ) as ArrayBuffer;
}

/**
 * Assinatura leve do conteúdo de uma figura, só para saber se duas
 * figuras são a mesma imagem repetida — não precisa de rigor
 * criptográfico para isso.
 */
function assinaturaDaFigura(bytes: Uint8Array): string {
  const amostra = Math.min(bytes.length, 4096);
  let soma = 0;
  for (let i = 0; i < amostra; i += 1) soma = (soma * 31 + bytes[i]) >>> 0;
  return `${bytes.length}-${soma}`;
}

/**
 * Uma marca d'água ou selo de "feito com tal ferramenta" costuma ser
 * um retângulo bem mais largo que alto (ou o contrário), e pequeno —
 * bem diferente da proporção de um print de tela real. É a mesma forma
 * em qualquer arquivo gerado por Gamma, Canva ou ferramenta parecida,
 * então a regra não é específica de uma marca só.
 */
export function pareceSeloOuMarca(largura: number, altura: number): boolean {
  const proporcao = Math.max(largura, altura) / Math.max(1, Math.min(largura, altura));
  return proporcao > 2.6 && Math.max(largura, altura) < 650;
}

/**
 * Se quase todos os pixels amostrados têm o mesmo valor, o decodificador
 * provavelmente falhou — um canal errado, uma máscara de transparência
 * ignorada. Mostrar um retângulo em branco no documento é pior do que
 * simplesmente não mostrar a figura.
 */
export function pareceDecodificacaoFalha(bytes: Buffer, canais: number): boolean {
  const passoBase = Math.max(1, Math.floor(bytes.length / (canais * 500)));
  const passo = passoBase * canais;

  const amostra: number[] = [];
  for (let i = 0; i + canais <= bytes.length; i += passo) amostra.push(bytes[i]);
  if (amostra.length < 15) return false;

  const media = amostra.reduce((soma, v) => soma + v, 0) / amostra.length;
  const variancia =
    amostra.reduce((soma, v) => soma + (v - media) ** 2, 0) / amostra.length;

  return variancia < 60;
}

/**
 * Percorre os objetos do arquivo atrás das imagens embutidas.
 *
 * Fotos costumam estar guardadas já como JPEG, e nesse caso os bytes
 * são aproveitados direto. Capturas de tela costumam estar comprimidas
 * em bitmap, e são remontadas como PNG.
 *
 * Uma figura que aparece mais de uma vez no arquivo quase sempre é uma
 * marca ou um logotipo repetido em cada página — um passo real do
 * procedimento não se repete pixel a pixel. Essas são descartadas.
 */
export async function extrairFigurasDoPdf(
  arquivo: ArrayBuffer,
): Promise<{ figuras: FiguraDoPdf[]; naoSuportadas: number }> {
  const documento = await PDFDocument.load(arquivo, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  const candidatas: FiguraDoPdf[] = [];
  let naoSuportadas = 0;

  for (const [, objeto] of documento.context.enumerateIndirectObjects()) {
    if (!(objeto instanceof PDFRawStream)) continue;

    const dicionario = objeto.dict;
    if (dicionario.get(PDFName.of("Subtype"))?.toString() !== "/Image") continue;

    const filtro = nomeDoFiltro(dicionario);
    const largura = numeroDoDicionario(dicionario, "Width");
    const altura = numeroDoDicionario(dicionario, "Height");
    const bitsPorCanal = numeroDoDicionario(dicionario, "BitsPerComponent") || 8;
    const espacoDeCor = dicionario.get(PDFName.of("ColorSpace"))?.toString() ?? "";

    // Ignora selos e ícones minúsculos, que só poluiriam o documento.
    if (largura < 40 || altura < 40) continue;

    // Ignora selos e marcas d'água (formato de crachá, bem mais largo
    // que alto), decodificados certo ou não — nenhum dos dois é conteúdo.
    if (pareceSeloOuMarca(largura, altura)) continue;

    if (filtro.includes("DCTDecode")) {
      const bytes = Buffer.from(objeto.contents);
      candidatas.push({
        conteudo: bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ) as ArrayBuffer,
        tipoMime: "image/jpeg",
      });
      continue;
    }

    if (filtro.includes("FlateDecode") && bitsPorCanal === 8) {
      const canais = espacoDeCor.includes("DeviceGray")
        ? 1
        : espacoDeCor.includes("DeviceRGB")
          ? 3
          : 0;

      if (canais === 0) {
        naoSuportadas += 1;
        continue;
      }

      try {
        const crus = inflateSync(Buffer.from(objeto.contents));

        if (pareceDecodificacaoFalha(crus, canais)) {
          naoSuportadas += 1;
          continue;
        }

        const png = montarPng(crus, largura, altura, canais);

        if (png) {
          candidatas.push({ conteudo: png, tipoMime: "image/png" });
        } else {
          naoSuportadas += 1;
        }
      } catch {
        naoSuportadas += 1;
      }

      continue;
    }

    // JPX, JBIG2, CCITT e afins exigem decodificador próprio.
    naoSuportadas += 1;
  }

  const contagem = new Map<string, number>();
  for (const figura of candidatas) {
    const assinatura = assinaturaDaFigura(new Uint8Array(figura.conteudo));
    contagem.set(assinatura, (contagem.get(assinatura) ?? 0) + 1);
  }

  const figuras = candidatas.filter(
    (figura) => contagem.get(assinaturaDaFigura(new Uint8Array(figura.conteudo))) === 1,
  );

  return { figuras, naoSuportadas };
}
