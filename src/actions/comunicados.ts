"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { registrar } from "@/lib/auditoria";
import { db } from "@/lib/db";
import { exigirQuemPublica } from "@/lib/sessaoServidor";

/**
 * Comunicados são avisos curtos, sem editor rico de propósito: são para
 * serem lidos em dez segundos, não para virarem documentação. O que
 * merece explicação longa vira artigo.
 */
export async function criarComunicado(dados: FormData) {
  const sessao = await exigirQuemPublica();

  const titulo = String(dados.get("titulo") ?? "").trim();
  const corpo = String(dados.get("corpo") ?? "").trim();
  const fixado = String(dados.get("fixado") ?? "") === "sim";

  if (titulo.length < 3) throw new Error("Escreva um título para o comunicado.");
  if (corpo.length < 5) throw new Error("Escreva o conteúdo do comunicado.");

  const comunicado = await db.comunicado.create({
    data: {
      titulo: titulo.slice(0, 160),
      corpo: corpo.slice(0, 4000),
      fixado,
      autorId: sessao.id,
    },
  });

  await registrar({
    acao: "CRIACAO",
    entidade: "artigo",
    entidadeId: null,
    descricao: `Publicou o comunicado "${comunicado.titulo}"`,
    autorId: sessao.id,
  });

  revalidatePath("/");
  revalidatePath("/comunicados");
  redirect("/admin/comunicados");
}

export async function alternarFixado(dados: FormData) {
  await exigirQuemPublica();

  const id = String(dados.get("id") ?? "").trim();
  if (!id) return;

  const comunicado = await db.comunicado.findUnique({ where: { id } });
  if (!comunicado) return;

  await db.comunicado.update({
    where: { id },
    data: { fixado: !comunicado.fixado },
  });

  revalidatePath("/");
  revalidatePath("/comunicados");
  redirect("/admin/comunicados");
}

export async function excluirComunicado(dados: FormData) {
  const sessao = await exigirQuemPublica();

  const id = String(dados.get("id") ?? "").trim();
  if (!id) return;

  const comunicado = await db.comunicado.delete({ where: { id } });

  await registrar({
    acao: "EXCLUSAO",
    entidade: "artigo",
    entidadeId: null,
    descricao: `Excluiu o comunicado "${comunicado.titulo}"`,
    autorId: sessao.id,
  });

  revalidatePath("/");
  revalidatePath("/comunicados");
  redirect("/admin/comunicados");
}
