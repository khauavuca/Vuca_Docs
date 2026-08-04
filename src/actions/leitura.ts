"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { exigirSessao, obterSessao } from "@/lib/sessaoServidor";

/** Marca ou desmarca o documento na lista de acesso rápido da pessoa. */
export async function alternarFavorito(dados: FormData) {
  const sessao = await exigirSessao();

  const artigoId = String(dados.get("artigoId") ?? "").trim();
  const slug = String(dados.get("slug") ?? "").trim();
  if (!artigoId) return;

  const existente = await db.favorito.findUnique({
    where: { artigoId_usuarioId: { artigoId, usuarioId: sessao.id } },
  });

  if (existente) {
    await db.favorito.delete({ where: { id: existente.id } });
  } else {
    await db.favorito.create({ data: { artigoId, usuarioId: sessao.id } });
  }

  revalidatePath("/");
  if (slug) revalidatePath(`/artigos/${slug}`);
}

/**
 * Anota que a pessoa abriu o documento.
 *
 * Serve para dois usos: devolver a ela o que consultou por último e
 * mostrar a quem escreve quais documentos a equipe realmente usa. Não
 * registra tempo de permanência nem sequência de navegação.
 */
export async function registrarLeitura(artigoId: string) {
  const sessao = await obterSessao();
  if (!sessao || !artigoId) return;

  try {
    await db.leituraDeArtigo.upsert({
      where: { artigoId_usuarioId: { artigoId, usuarioId: sessao.id } },
      update: { vezes: { increment: 1 }, ultimaLeitura: new Date() },
      create: { artigoId, usuarioId: sessao.id },
    });
  } catch (erro) {
    console.error("Falha ao registrar a leitura:", erro);
  }
}
