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
 */

export async function extrairTextoDoPdf(arquivo: ArrayBuffer): Promise<string> {
  const resultado = await pdfParse(Buffer.from(arquivo));
  return resultado.text ?? "";
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
 * Percorre os objetos do arquivo atrás das imagens embutidas.
 *
 * Fotos costumam estar guardadas já como JPEG, e nesse caso os bytes
 * são aproveitados direto. Capturas de tela costumam estar comprimidas
 * em bitmap, e são remontadas como PNG.
 */
export async function extrairFigurasDoPdf(
  arquivo: ArrayBuffer,
): Promise<{ figuras: FiguraDoPdf[]; naoSuportadas: number }> {
  const documento = await PDFDocument.load(arquivo, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  const figuras: FiguraDoPdf[] = [];
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

    if (filtro.includes("DCTDecode")) {
      const bytes = Buffer.from(objeto.contents);
      figuras.push({
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
        const png = montarPng(crus, largura, altura, canais);

        if (png) {
          figuras.push({ conteudo: png, tipoMime: "image/png" });
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

  return { figuras, naoSuportadas };
}
