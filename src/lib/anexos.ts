import { criarTokenDeEnvio, enviarArquivo } from "@/lib/armazenamento";
import { db } from "@/lib/db";
import { gerarSlug } from "@/lib/texto";

export const TAMANHO_MAXIMO_DE_ANEXO = 5 * 1024 * 1024;

export const TIPOS_DE_ANEXO_ACEITOS = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

// Um vídeo de uns 5 minutos, com folga pra qualidade mais alta.
export const TAMANHO_MAXIMO_DE_VIDEO = 250 * 1024 * 1024;

export const TIPOS_DE_VIDEO_ACEITOS = new Set(["video/mp4", "video/webm", "video/quicktime"]);

// Deck de slides em HTML, compilado fora da base — um arquivo só, sem
// dependência externa, mas pode carregar imagem embutida em base64.
export const TAMANHO_MAXIMO_DE_APRESENTACAO = 15 * 1024 * 1024;

export const TIPOS_DE_APRESENTACAO_ACEITOS = new Set(["text/html"]);

function chaveParaAnexo(anexoId: string, nomeOriginal: string, extensaoPadrao: string): string {
  const nome = nomeOriginal.slice(0, 200) || extensaoPadrao;

  const extensao = nome.includes(".")
    ? nome.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : extensaoPadrao;

  const nomeBase = gerarSlug(nome.replace(/\.[^.]+$/, "")).slice(0, 60) || "arquivo";
  const ano = new Date().getFullYear();

  return `${ano}/${anexoId}-${nomeBase}.${extensao}`;
}

/**
 * Guarda um arquivo no balde privado e registra o anexo.
 *
 * É o caminho único de entrada de arquivo pequeno na base: vale tanto
 * para a imagem colada no editor quanto para as figuras que vêm dentro
 * de um documento importado do Word.
 */
export async function guardarAnexo({
  conteudo,
  nomeOriginal,
  tipoMime,
  enviadoPorId,
}: {
  conteudo: ArrayBuffer;
  nomeOriginal: string;
  tipoMime: string;
  enviadoPorId?: string;
}): Promise<{ id: string; endereco: string; nome: string }> {
  const anexo = await db.anexo.create({
    data: {
      // A chave depende do identificador gerado, então grava primeiro.
      chave: `temporario-${Math.random().toString(36).slice(2)}`,
      nomeOriginal: nomeOriginal.slice(0, 200) || "arquivo",
      tipoMime,
      tamanho: conteudo.byteLength,
      enviadoPorId,
    },
  });

  const chave = chaveParaAnexo(anexo.id, nomeOriginal, "bin");

  try {
    await enviarArquivo(chave, conteudo, tipoMime);
  } catch (erro) {
    await db.anexo.delete({ where: { id: anexo.id } });
    throw erro;
  }

  await db.anexo.update({ where: { id: anexo.id }, data: { chave } });

  return { id: anexo.id, endereco: `/api/anexos/${anexo.id}`, nome: anexo.nomeOriginal };
}

/**
 * Prepara o registro de um vídeo e devolve um token de uso único para o
 * navegador enviar o arquivo direto pro armazenamento, pelo cliente
 * Supabase do lado do navegador. O vídeo em si nunca passa pela nossa
 * função — só os poucos bytes deste pedido e da resposta.
 */
export async function prepararEnvioDeVideo({
  nomeOriginal,
  tipoMime,
  tamanho,
  enviadoPorId,
}: {
  nomeOriginal: string;
  tipoMime: string;
  tamanho: number;
  enviadoPorId?: string;
}): Promise<{ id: string; endereco: string; path: string; token: string }> {
  const anexo = await db.anexo.create({
    data: {
      chave: `temporario-${Math.random().toString(36).slice(2)}`,
      nomeOriginal: nomeOriginal.slice(0, 200) || "video",
      tipoMime,
      tamanho,
      enviadoPorId,
    },
  });

  const chave = chaveParaAnexo(anexo.id, nomeOriginal, "mp4");
  const { path, token } = await criarTokenDeEnvio(chave);

  await db.anexo.update({ where: { id: anexo.id }, data: { chave } });

  return { id: anexo.id, endereco: `/api/anexos/${anexo.id}`, path, token };
}
