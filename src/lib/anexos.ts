import { enviarArquivo } from "@/lib/armazenamento";
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

/**
 * Guarda um arquivo no balde privado e registra o anexo.
 *
 * É o caminho único de entrada de arquivo na base: vale tanto para a
 * imagem colada no editor quanto para as figuras que vêm dentro de um
 * documento importado do Word.
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
  const nome = nomeOriginal.slice(0, 200) || "arquivo";

  const extensao = nome.includes(".")
    ? nome.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "bin";

  const nomeBase = gerarSlug(nome.replace(/\.[^.]+$/, "")).slice(0, 60) || "arquivo";
  const ano = new Date().getFullYear();

  const anexo = await db.anexo.create({
    data: {
      // A chave depende do identificador gerado, então grava primeiro.
      chave: `temporario-${Math.random().toString(36).slice(2)}`,
      nomeOriginal: nome,
      tipoMime,
      tamanho: conteudo.byteLength,
      enviadoPorId,
    },
  });

  const chave = `${ano}/${anexo.id}-${nomeBase}.${extensao}`;

  try {
    await enviarArquivo(chave, conteudo, tipoMime);
  } catch (erro) {
    await db.anexo.delete({ where: { id: anexo.id } });
    throw erro;
  }

  await db.anexo.update({ where: { id: anexo.id }, data: { chave } });

  return { id: anexo.id, endereco: `/api/anexos/${anexo.id}`, nome };
}
