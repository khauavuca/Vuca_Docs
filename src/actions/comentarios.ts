"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { exigirQuemEscreve } from "@/lib/sessaoServidor";

const AUTOR_SELECIONADO = { select: { nome: true } } as const;

export async function criarComentario(dados: {
  artigoId: string;
  marcaId: string;
  trecho: string;
  texto: string;
}) {
  const sessao = await exigirQuemEscreve();

  const artigo = await db.artigo.findUnique({
    where: { id: dados.artigoId },
    select: { id: true },
  });
  if (!artigo) throw new Error("Documento não encontrado.");

  const texto = dados.texto.trim();
  if (texto.length < 2) throw new Error("Escreva o comentário antes de salvar.");

  const comentario = await db.comentarioDeArtigo.create({
    data: {
      artigoId: dados.artigoId,
      marcaId: dados.marcaId,
      trecho: dados.trecho.slice(0, 300),
      texto: texto.slice(0, 2000),
      autorId: sessao.id,
    },
    include: {
      autor: AUTOR_SELECIONADO,
      resolvidoPor: AUTOR_SELECIONADO,
      respostas: { include: { autor: AUTOR_SELECIONADO } },
    },
  });

  revalidatePath(`/admin/artigos/${dados.artigoId}`);
  return comentario;
}

export async function responderComentario(dados: { comentarioId: string; texto: string }) {
  const sessao = await exigirQuemEscreve();

  const texto = dados.texto.trim();
  if (texto.length < 1) throw new Error("Escreva a resposta antes de enviar.");

  const resposta = await db.respostaDeComentario.create({
    data: {
      comentarioId: dados.comentarioId,
      texto: texto.slice(0, 2000),
      autorId: sessao.id,
    },
    include: { autor: AUTOR_SELECIONADO },
  });

  const comentario = await db.comentarioDeArtigo.findUnique({
    where: { id: dados.comentarioId },
    select: { artigoId: true },
  });
  if (comentario) revalidatePath(`/admin/artigos/${comentario.artigoId}`);

  return resposta;
}

export async function resolverComentario(comentarioId: string) {
  const sessao = await exigirQuemEscreve();

  const comentario = await db.comentarioDeArtigo.update({
    where: { id: comentarioId },
    data: { resolvido: true, resolvidoEm: new Date(), resolvidoPorId: sessao.id },
    include: {
      autor: AUTOR_SELECIONADO,
      resolvidoPor: AUTOR_SELECIONADO,
      respostas: { include: { autor: AUTOR_SELECIONADO } },
    },
  });

  revalidatePath(`/admin/artigos/${comentario.artigoId}`);
  return comentario;
}

export async function reabrirComentario(comentarioId: string) {
  await exigirQuemEscreve();

  const comentario = await db.comentarioDeArtigo.update({
    where: { id: comentarioId },
    data: { resolvido: false, resolvidoEm: null, resolvidoPorId: null },
    include: {
      autor: AUTOR_SELECIONADO,
      resolvidoPor: AUTOR_SELECIONADO,
      respostas: { include: { autor: AUTOR_SELECIONADO } },
    },
  });

  revalidatePath(`/admin/artigos/${comentario.artigoId}`);
  return comentario;
}
