"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { exigirSessao, obterSessao } from "@/lib/sessaoServidor";
import { normalizar } from "@/lib/texto";

/**
 * Resposta do leitor ao fim do documento. Serve para descobrir qual
 * procedimento não está resolvendo na prática, sem depender de alguém
 * reclamar em outro canal.
 */
export async function avaliarArtigo(dados: FormData) {
  const sessao = await exigirSessao();

  const artigoId = String(dados.get("artigoId") ?? "").trim();
  const slug = String(dados.get("slug") ?? "").trim();
  const resolveu = String(dados.get("resolveu") ?? "") === "sim";

  if (!artigoId) return;

  await db.avaliacaoDeArtigo.upsert({
    where: { artigoId_usuarioId: { artigoId, usuarioId: sessao.id } },
    update: { resolveu, criadoEm: new Date() },
    create: { artigoId, usuarioId: sessao.id, resolveu },
  });

  revalidatePath(`/artigos/${slug}`);
  revalidatePath("/admin/saude");
}

/**
 * Guarda o termo que não achou nada. Só o texto procurado é gravado,
 * sem vínculo com a pessoa: o objetivo é enxergar a lacuna do acervo,
 * não acompanhar o que cada um pesquisa.
 */
export async function registrarBuscaSemResultado(termo: string) {
  const sessao = await obterSessao();
  if (!sessao) return;

  const limpo = normalizar(termo).slice(0, 120);
  if (limpo.length < 3) return;

  try {
    await db.buscaSemResultado.create({ data: { termo: limpo } });
  } catch (erro) {
    console.error("Falha ao registrar a busca sem resultado:", erro);
  }
}
