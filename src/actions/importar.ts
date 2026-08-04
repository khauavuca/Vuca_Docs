"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import JSZip from "jszip";
import mammoth from "mammoth";

import { guardarAnexo } from "@/lib/anexos";
import { registrar } from "@/lib/auditoria";
import { db } from "@/lib/db";
import { extrairFigurasDoPdf, extrairTextoDoPdf } from "@/lib/importarPdf";
import { estruturarTextoSolto } from "@/lib/textoEstruturado";
import { limparConteudo } from "@/lib/sanitizar";
import { exigirQuemEscreve } from "@/lib/sessaoServidor";
import { gerarSlug, htmlParaTexto, normalizar } from "@/lib/texto";

export type EstadoDaImportacao = { erro?: string };

const TIPO_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const TAMANHO_MAXIMO = 15 * 1024 * 1024;

/**
 * O título do artigo é o primeiro nível do layout, então os títulos do
 * Word descem um degrau. Assim o sumário e a divisão em folhas funcionam.
 * O Word em português usa "Título", e em inglês "Heading".
 */
const MAPA_DE_ESTILOS = [
  "p[style-name='Heading 1'] => h2:fresh",
  "p[style-name='Heading 2'] => h3:fresh",
  "p[style-name='Heading 3'] => h4:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Título 1'] => h2:fresh",
  "p[style-name='Título 2'] => h3:fresh",
  "p[style-name='Título 3'] => h4:fresh",
  "p[style-name='Título 4'] => h4:fresh",
  "p[style-name='Subtitle'] => p:fresh",
  "p[style-name='Subtítulo'] => p:fresh",
];

const TIPO_POR_EXTENSAO: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
};

/**
 * Identifica um arquivo pelo conteúdo, para saber se a figura extraída
 * do pacote já foi trazida para dentro do texto. Não precisa de rigor
 * criptográfico: serve apenas para não repetir a mesma imagem.
 */
function assinatura(bytes: Uint8Array): string {
  const amostra = Math.min(bytes.length, 4096);
  let soma = 0;
  for (let i = 0; i < amostra; i += 1) soma = (soma * 31 + bytes[i]) >>> 0;
  return `${bytes.length}-${soma}`;
}

function paraArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

/** image2.png vem antes de image10.png, e não o contrário. */
function ordemNatural(a: string, b: string): number {
  const numero = (nome: string) => Number(nome.match(/(\d+)/)?.[1] ?? 0);
  return numero(a) - numero(b) || a.localeCompare(b);
}

async function slugDisponivel(titulo: string): Promise<string> {
  const base = gerarSlug(titulo);
  let candidato = base;
  let contador = 2;

  for (;;) {
    const jaUsado = await db.artigo.findUnique({ where: { slug: candidato } });
    if (!jaUsado) return candidato;
    candidato = `${base}-${contador}`;
    contador += 1;
  }
}

/**
 * Encaixa as figuras nos marcadores de imagem do documento.
 *
 * Documento bem escrito traz, em cada passo, um bloco dizendo que ali
 * entra um print. Quando a figura não vem presa ao texto, mas existe no
 * arquivo, a ordem dos marcadores diz a que passo cada uma pertence.
 * O marcador é substituído pela figura, e a legenda logo abaixo dele é
 * preservada.
 */
function encaixarFigurasNosMarcadores(
  html: string,
  enderecos: string[],
): { html: string; restantes: string[] } {
  if (enderecos.length === 0) return { html, restantes: [] };

  let usadas = 0;

  const resultado = html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (paragrafo) => {
    const ehMarcador =
      /espa[çc]o\s+reservado/i.test(paragrafo) ||
      /^\s*<p[^>]*>\s*(<[^>]+>\s*)*imagem\s*[—–-]/i.test(paragrafo);

    if (!ehMarcador || usadas >= enderecos.length) return paragrafo;

    const endereco = enderecos[usadas];
    usadas += 1;

    return `<p><img src="${endereco}" alt="Figura ${usadas} do documento" /></p>`;
  });

  return { html: resultado, restantes: enderecos.slice(usadas) };
}

/**
 * Seção com as figuras que existem no arquivo mas não têm posição
 * conhecida no texto. É melhor entregá-las para serem posicionadas do
 * que deixar o documento chegar incompleto.
 */
function secaoDeFiguras(enderecos: string[], naoSuportadas: number): string {
  let html = "";

  if (enderecos.length > 0) {
    const figuras = enderecos
      .map(
        (endereco, indice) =>
          `<p><img src="${endereco}" alt="Figura ${indice + 1} do documento original" /></p>`,
      )
      .join("");

    html += `<h2>Figuras do documento original</h2><p>Estas imagens vieram do arquivo, na ordem em que aparecem nele. Mova cada uma para o ponto certo do texto e apague esta seção.</p>${figuras}`;
  }

  if (naoSuportadas > 0) {
    html += `<p><em>${naoSuportadas} ${
      naoSuportadas === 1 ? "figura estava" : "figuras estavam"
    } em formato que o navegador não abre. Salve como PNG e envie pelo editor.</em></p>`;
  }

  return html;
}

/** Usa o primeiro título do documento como nome do artigo, se existir. */
function separarTitulo(html: string, nomeDoArquivo: string) {
  const primeiro = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const textoDoTitulo = primeiro ? htmlParaTexto(primeiro[1]) : "";

  if (primeiro && textoDoTitulo.length >= 3 && html.indexOf(primeiro[0]) < 200) {
    return { titulo: textoDoTitulo, conteudo: html.replace(primeiro[0], "") };
  }

  return {
    titulo: nomeDoArquivo.replace(/\.docx$/i, "").replace(/[_-]+/g, " ").trim(),
    conteudo: html,
  };
}

/**
 * Varre o pacote do Word atrás de toda figura que exista no arquivo.
 *
 * O conversor só enxerga as imagens inseridas direto no texto. As que
 * estão dentro de caixas de texto, formas ou agrupamentos ficariam de
 * fora, e o documento chegaria incompleto. Aqui elas são recuperadas.
 */
async function recuperarFigurasRestantes(
  arquivo: ArrayBuffer,
  jaTrazidas: Set<string>,
  usuarioId: string,
): Promise<{ enderecos: string[]; naoSuportadas: number }> {
  const pacote = await JSZip.loadAsync(arquivo);

  const nomes = Object.keys(pacote.files)
    .filter((nome) => nome.startsWith("word/media/") && !pacote.files[nome].dir)
    .sort(ordemNatural);

  const enderecos: string[] = [];
  let naoSuportadas = 0;

  for (const nome of nomes) {
    const extensao = nome.split(".").pop()?.toLowerCase() ?? "";
    const tipoMime = TIPO_POR_EXTENSAO[extensao];

    // Formatos do Windows como EMF e WMF não abrem em navegador.
    if (!tipoMime) {
      naoSuportadas += 1;
      continue;
    }

    const bytes = await pacote.files[nome].async("uint8array");
    if (jaTrazidas.has(assinatura(bytes))) continue;

    const anexo = await guardarAnexo({
      conteudo: paraArrayBuffer(bytes),
      nomeOriginal: nome.replace("word/media/", ""),
      tipoMime,
      enviadoPorId: usuarioId,
    });

    enderecos.push(anexo.endereco);
  }

  return { enderecos, naoSuportadas };
}

export async function importarDocumento(
  _estadoAnterior: EstadoDaImportacao,
  dados: FormData,
): Promise<EstadoDaImportacao> {
  const sessao = await exigirQuemEscreve();

  const arquivo = dados.get("arquivo");
  const areaId = String(dados.get("areaId") ?? "").trim();
  const tipoId = String(dados.get("tipoId") ?? "").trim();

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Escolha um arquivo do Word para importar." };
  }

  const nomeEmMinusculas = arquivo.name.toLowerCase();
  const ehWord = arquivo.type === TIPO_DOCX || nomeEmMinusculas.endsWith(".docx");
  const ehPdf = arquivo.type === "application/pdf" || nomeEmMinusculas.endsWith(".pdf");

  if (!ehWord && !ehPdf) {
    return {
      erro: "Só é possível importar arquivos .docx e .pdf. Se o seu documento é .doc, abra no Word e salve como .docx.",
    };
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    return { erro: "Arquivo grande demais. O limite é de 15 MB." };
  }

  const conteudoDoArquivo = await arquivo.arrayBuffer();

  if (ehPdf) {
    return importarDoPdf({
      conteudoDoArquivo,
      nomeDoArquivo: arquivo.name,
      usuarioId: sessao.id,
      areaId,
      tipoId,
    });
  }

  const figurasNoTexto = new Set<string>();

  let htmlBruto: string;

  try {
    const resultado = await mammoth.convertToHtml(
      { buffer: Buffer.from(conteudoDoArquivo) },
      {
        styleMap: MAPA_DE_ESTILOS,
        convertImage: mammoth.images.imgElement(async (imagem) => {
          const bytes = new Uint8Array(await imagem.read());
          figurasNoTexto.add(assinatura(bytes));

          const tipoMime = imagem.contentType ?? "image/png";
          const extensao = tipoMime.split("/")[1] ?? "png";

          const anexo = await guardarAnexo({
            conteudo: paraArrayBuffer(bytes),
            nomeOriginal: `figura.${extensao}`,
            tipoMime,
            enviadoPorId: sessao.id,
          });

          return { src: anexo.endereco, alt: "Figura do documento" };
        }),
      },
    );

    htmlBruto = resultado.value;
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "erro desconhecido";
    return { erro: `Não foi possível ler o arquivo: ${mensagem}` };
  }

  let complemento = "";

  try {
    const { enderecos, naoSuportadas } = await recuperarFigurasRestantes(
      conteudoDoArquivo,
      figurasNoTexto,
      sessao.id,
    );

    const encaixe = encaixarFigurasNosMarcadores(htmlBruto, enderecos);
    htmlBruto = encaixe.html;

    complemento = secaoDeFiguras(encaixe.restantes, naoSuportadas);
  } catch (erro) {
    // A causa mais comum é o armazenamento recusar o envio. Esconder o
    // motivo faz o documento chegar sem figura e ninguém saber por quê.
    const motivo = erro instanceof Error ? erro.message : "causa desconhecida";
    return {
      erro: `O texto foi convertido, mas as figuras não puderam ser guardadas: ${motivo}. Confira a chave do armazenamento e o balde, e importe de novo.`,
    };
  }

  const { titulo, conteudo } = separarTitulo(htmlBruto, arquivo.name);

  return finalizarImportacao({
    titulo,
    html: conteudo + complemento,
    usuarioId: sessao.id,
    areaId,
    tipoId,
  });
}

/** Grava o documento importado como rascunho e abre o editor. */
async function finalizarImportacao({
  titulo,
  html,
  usuarioId,
  areaId,
  tipoId,
}: {
  titulo: string;
  html: string;
  usuarioId: string;
  areaId: string;
  tipoId: string;
}): Promise<EstadoDaImportacao> {
  const conteudoHtml = limparConteudo(html);
  const conteudoTexto = htmlParaTexto(conteudoHtml);

  if (conteudoTexto.length < 10 && !conteudoHtml.includes("<img")) {
    return { erro: "O arquivo foi lido, mas não tinha conteúdo aproveitável." };
  }

  const nome = titulo || "Documento importado";

  const artigo = await db.artigo.create({
    data: {
      titulo: nome,
      slug: await slugDisponivel(nome),
      conteudoHtml,
      conteudoTexto,
      buscaTexto: normalizar(`${nome} ${conteudoTexto}`),
      // Entra sempre como rascunho: importar não é publicar.
      situacao: "RASCUNHO",
      areaId: areaId || null,
      tipoId: tipoId || null,
      autorId: usuarioId,
    },
  });

  await registrar({
    acao: "CRIACAO",
    entidade: "artigo",
    entidadeId: artigo.id,
    descricao: `Importou o documento "${nome}"`,
    autorId: usuarioId,
  });

  revalidatePath("/admin");
  redirect(`/admin/artigos/${artigo.id}`);
}

/**
 * Caminho do PDF: o texto vira estrutura por convenção de escrita, e as
 * figuras são extraídas do arquivo e entregues em uma seção própria,
 * porque o formato não guarda a ligação entre imagem e parágrafo.
 */
async function importarDoPdf({
  conteudoDoArquivo,
  nomeDoArquivo,
  usuarioId,
  areaId,
  tipoId,
}: {
  conteudoDoArquivo: ArrayBuffer;
  nomeDoArquivo: string;
  usuarioId: string;
  areaId: string;
  tipoId: string;
}): Promise<EstadoDaImportacao> {
  let html: string;

  try {
    const texto = await extrairTextoDoPdf(conteudoDoArquivo);
    html = estruturarTextoSolto(texto);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "erro desconhecido";
    return { erro: `Não foi possível ler o PDF: ${mensagem}` };
  }

  let complemento = "";

  try {
    const { figuras, naoSuportadas } = await extrairFigurasDoPdf(conteudoDoArquivo);
    const enderecos: string[] = [];

    for (const [indice, figura] of figuras.entries()) {
      const anexo = await guardarAnexo({
        conteudo: figura.conteudo,
        nomeOriginal: `figura-${indice + 1}.${figura.tipoMime === "image/jpeg" ? "jpg" : "png"}`,
        tipoMime: figura.tipoMime,
        enviadoPorId: usuarioId,
      });

      enderecos.push(anexo.endereco);
    }

    complemento = secaoDeFiguras(enderecos, naoSuportadas);
  } catch {
    complemento =
      "<p><em>Não foi possível extrair as figuras deste PDF. Envie as imagens pelo editor.</em></p>";
  }

  const nomeLimpo = nomeDoArquivo
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();

  const { titulo, conteudo } = separarTitulo(html, nomeLimpo);

  return finalizarImportacao({
    titulo,
    html: conteudo + complemento,
    usuarioId,
    areaId,
    tipoId,
  });
}
