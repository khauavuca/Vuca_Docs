"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { exigirQuemEscreve } from "@/lib/sessaoServidor";
import { gerarSlug } from "@/lib/texto";

/** Endereço único, acrescentando um número quando já existe. */
async function slugDisponivel(titulo: string): Promise<string> {
  const base = gerarSlug(titulo);
  let candidato = base;
  let contador = 2;

  for (;;) {
    const jaUsado = await db.apresentacao.findUnique({ where: { slug: candidato } });
    if (!jaUsado) return candidato;
    candidato = `${base}-${contador}`;
    contador += 1;
  }
}

export async function criarApresentacao(dados: FormData) {
  const sessao = await exigirQuemEscreve();

  const titulo = String(dados.get("titulo") ?? "").trim();
  const anexoId = String(dados.get("anexoId") ?? "").trim();

  if (titulo.length < 3) {
    throw new Error("O título precisa ter pelo menos 3 caracteres.");
  }
  if (!anexoId) {
    throw new Error("Envie o arquivo antes de salvar.");
  }

  await db.apresentacao.create({
    data: {
      titulo,
      slug: await slugDisponivel(titulo),
      anexoId,
      autorId: sessao.id,
    },
  });

  revalidatePath("/apresentacoes");
  revalidatePath("/admin/apresentacoes");
  redirect("/admin/apresentacoes");
}

export async function excluirApresentacao(dados: FormData) {
  await exigirQuemEscreve();

  const id = String(dados.get("id") ?? "").trim();
  if (!id) return;

  await db.apresentacao.delete({ where: { id } });

  revalidatePath("/apresentacoes");
  revalidatePath("/admin/apresentacoes");
}
