"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { registrar } from "@/lib/auditoria";
import { db } from "@/lib/db";
import { exigirAdministrador } from "@/lib/sessaoServidor";
import { gerarSlug, normalizar } from "@/lib/texto";

/**
 * Áreas, tipos e marcadores são criados e mantidos aqui pela interface.
 * Nada disso fica fixo no programa: a estrutura acompanha o crescimento
 * da documentação sem exigir alteração no código.
 */

async function slugUnicoDeArea(nome: string, idAtual?: string): Promise<string> {
  const base = gerarSlug(nome);
  let candidato = base;
  let contador = 2;

  for (;;) {
    const existente = await db.area.findUnique({ where: { slug: candidato } });
    if (!existente || existente.id === idAtual) return candidato;
    candidato = `${base}-${contador}`;
    contador += 1;
  }
}

/**
 * Recarrega as telas e devolve o navegador por uma visita comum.
 *
 * Sem isso, recarregar a página depois de criar uma área reenviava o
 * mesmo comando e criava tudo de novo.
 */
function voltarParaEstrutura(): never {
  revalidatePath("/");
  revalidatePath("/admin/estrutura");
  redirect("/admin/estrutura");
}

export async function criarArea(dados: FormData) {
  const sessao = await exigirAdministrador();

  const nome = String(dados.get("nome") ?? "").trim();
  const descricao = String(dados.get("descricao") ?? "").trim();
  const paiId = String(dados.get("paiId") ?? "").trim();

  if (nome.length < 2) return;

  // Só dois níveis: uma subárea não pode virar mãe de outra.
  let paiValido: string | null = null;
  if (paiId) {
    const pai = await db.area.findUnique({ where: { id: paiId } });
    if (pai && pai.paiId === null) paiValido = pai.id;
  }

  // Duas áreas com o mesmo nome no mesmo nível só confundem quem procura.
  const irmas = await db.area.findMany({ where: { paiId: paiValido } });
  const jaExiste = irmas.some((irma) => normalizar(irma.nome) === normalizar(nome));

  if (jaExiste) {
    throw new Error(`Já existe uma área chamada "${nome}" neste nível.`);
  }

  const area = await db.area.create({
    data: {
      nome,
      slug: await slugUnicoDeArea(nome),
      descricao: descricao || null,
      paiId: paiValido,
    },
  });

  await registrar({
    acao: "CRIACAO",
    entidade: "area",
    entidadeId: area.id,
    descricao: `Criou a área "${nome}"`,
    autorId: sessao.id,
  });

  voltarParaEstrutura();
}

/**
 * Apaga a área de vez. Só funciona quando ela está vazia: com documento
 * ou subárea dentro, a exclusão viraria perda silenciosa de conteúdo.
 */
export async function excluirArea(dados: FormData) {
  const sessao = await exigirAdministrador();

  const id = String(dados.get("id") ?? "").trim();
  if (!id) return;

  const [documentos, subareas] = await Promise.all([
    db.artigo.count({ where: { areaId: id } }),
    db.area.count({ where: { paiId: id } }),
  ]);

  if (documentos > 0) {
    throw new Error(
      "Esta área tem documentos. Mova os documentos para outra área antes de excluí-la.",
    );
  }

  if (subareas > 0) {
    throw new Error("Esta área tem subáreas. Exclua as subáreas primeiro.");
  }

  const area = await db.area.delete({ where: { id } });

  await registrar({
    acao: "EXCLUSAO",
    entidade: "area",
    entidadeId: id,
    descricao: `Excluiu a área "${area.nome}"`,
    autorId: sessao.id,
  });

  voltarParaEstrutura();
}

export async function renomearArea(dados: FormData) {
  await exigirAdministrador();

  const id = String(dados.get("id") ?? "").trim();
  const nome = String(dados.get("nome") ?? "").trim();
  const descricao = String(dados.get("descricao") ?? "").trim();

  if (!id || nome.length < 2) return;

  // O endereço não muda ao renomear: links já compartilhados continuam valendo.
  await db.area.update({
    where: { id },
    data: { nome, descricao: descricao || null },
  });

  voltarParaEstrutura();
}

export async function moverArea(dados: FormData) {
  await exigirAdministrador();

  const id = String(dados.get("id") ?? "").trim();
  const direcao = String(dados.get("direcao") ?? "");
  if (!id) return;

  const area = await db.area.findUnique({ where: { id } });
  if (!area) return;

  await db.area.update({
    where: { id },
    data: { ordem: area.ordem + (direcao === "subir" ? -1 : 1) },
  });

  voltarParaEstrutura();
}

export async function arquivarArea(dados: FormData) {
  await exigirAdministrador();

  const id = String(dados.get("id") ?? "").trim();
  if (!id) return;

  const quantidade = await db.artigo.count({ where: { areaId: id } });
  if (quantidade > 0) {
    throw new Error(
      "Esta área ainda tem documentos. Mova os documentos antes de arquivá-la.",
    );
  }

  await db.area.update({ where: { id }, data: { arquivada: true } });
  voltarParaEstrutura();
}

export async function reativarArea(dados: FormData) {
  await exigirAdministrador();

  const id = String(dados.get("id") ?? "").trim();
  if (!id) return;

  await db.area.update({ where: { id }, data: { arquivada: false } });
  voltarParaEstrutura();
}

export async function criarTipo(dados: FormData) {
  await exigirAdministrador();

  const nome = String(dados.get("nome") ?? "").trim();
  const descricao = String(dados.get("descricao") ?? "").trim();
  if (nome.length < 2) return;

  await db.tipo.create({
    data: { nome, slug: gerarSlug(nome), descricao: descricao || null },
  });

  voltarParaEstrutura();
}

export async function excluirTipo(dados: FormData) {
  await exigirAdministrador();

  const id = String(dados.get("id") ?? "").trim();
  if (!id) return;

  // Os documentos continuam existindo: apenas ficam sem tipo.
  await db.tipo.delete({ where: { id } });
  voltarParaEstrutura();
}

export async function excluirMarcador(dados: FormData) {
  await exigirAdministrador();

  const id = String(dados.get("id") ?? "").trim();
  if (!id) return;

  await db.marcador.delete({ where: { id } });
  voltarParaEstrutura();
}
