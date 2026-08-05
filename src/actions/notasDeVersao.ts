"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TipoDeMudanca } from "@prisma/client";

import { registrar } from "@/lib/auditoria";
import { db } from "@/lib/db";
import { exigirQuemPublica } from "@/lib/sessaoServidor";

export type EstadoDaNotaDeVersao = { erro?: string };

const TIPOS_VALIDOS: TipoDeMudanca[] = ["NOVIDADE", "MELHORIA", "CORRECAO", "TAREFA"];

/**
 * Os itens chegam do formulário como três listas paralelas — um campo
 * "tipo[]" e um campo "texto[]" por linha —, já que HTML não tem um
 * jeito nativo de agrupar campos repetidos em um objeto por linha.
 */
function extrairItens(dados: FormData): Array<{ tipo: TipoDeMudanca; texto: string }> {
  const tipos = dados.getAll("itemTipo").map(String);
  const textos = dados.getAll("itemTexto").map(String);

  const itens: Array<{ tipo: TipoDeMudanca; texto: string }> = [];

  for (let i = 0; i < textos.length; i += 1) {
    const texto = textos[i].trim();
    const tipo = tipos[i] as TipoDeMudanca;

    if (!texto || !TIPOS_VALIDOS.includes(tipo)) continue;
    itens.push({ tipo, texto });
  }

  return itens;
}

function atualizarTelas() {
  revalidatePath("/notas-de-versao");
  revalidatePath("/admin/notas-de-versao");
}

export async function criarNotaDeVersao(
  _estadoAnterior: EstadoDaNotaDeVersao,
  dados: FormData,
): Promise<EstadoDaNotaDeVersao> {
  const sessao = await exigirQuemPublica();

  const produto = String(dados.get("produto") ?? "").trim();
  const versao = String(dados.get("versao") ?? "").trim();
  const titulo = String(dados.get("titulo") ?? "").trim();
  const descricao = String(dados.get("descricao") ?? "").trim();
  const dataDeLancamento = String(dados.get("dataDeLancamento") ?? "").trim();
  const publicar = String(dados.get("acao") ?? "") === "publicar";

  if (produto.length < 2) return { erro: "Informe o produto ou sistema." };
  if (versao.length < 1) return { erro: "Informe o número da versão." };

  const itens = extrairItens(dados);
  if (publicar && itens.length === 0) {
    return { erro: "Adicione ao menos um item antes de publicar." };
  }

  const nota = await db.notaDeVersao.create({
    data: {
      produto,
      versao,
      titulo: titulo || null,
      descricao: descricao || null,
      dataDeLancamento: dataDeLancamento ? new Date(dataDeLancamento) : null,
      publicada: publicar,
      autorId: sessao.id,
      itens: {
        create: itens.map((item, indice) => ({ ...item, ordem: indice })),
      },
    },
  });

  await registrar({
    acao: "CRIACAO",
    entidade: "artigo",
    entidadeId: null,
    descricao: `${publicar ? "Publicou" : "Salvou"} as notas da versão ${produto} ${versao}`,
    autorId: sessao.id,
  });

  atualizarTelas();
  redirect("/admin/notas-de-versao");
}

export async function alternarPublicacaoDaNota(dados: FormData) {
  await exigirQuemPublica();

  const id = String(dados.get("id") ?? "").trim();
  if (!id) return;

  const nota = await db.notaDeVersao.findUnique({ where: { id } });
  if (!nota) return;

  await db.notaDeVersao.update({
    where: { id },
    data: { publicada: !nota.publicada },
  });

  atualizarTelas();
}

export async function excluirNotaDeVersao(dados: FormData) {
  const sessao = await exigirQuemPublica();

  const id = String(dados.get("id") ?? "").trim();
  if (!id) return;

  const nota = await db.notaDeVersao.delete({ where: { id } });

  await registrar({
    acao: "EXCLUSAO",
    entidade: "artigo",
    entidadeId: null,
    descricao: `Excluiu as notas da versão ${nota.produto} ${nota.versao}`,
    autorId: sessao.id,
  });

  atualizarTelas();
}
