"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SituacaoArtigo } from "@prisma/client";

import { registrar } from "@/lib/auditoria";
import { db } from "@/lib/db";
import { limparConteudo } from "@/lib/sanitizar";
import { podePublicar } from "@/lib/sessao";
import { exigirQuemEscreve, exigirSessao } from "@/lib/sessaoServidor";
import { gerarSlug, htmlParaTexto, normalizar } from "@/lib/texto";

export type EstadoDoArtigo = { erro?: string };

/** Garante endereço único, acrescentando um número quando já existe. */
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

/** Converte a lista digitada em marcadores, criando os que ainda não existem. */
async function prepararMarcadores(texto: string) {
  const nomes = texto
    .split(",")
    .map((nome) => nome.trim())
    .filter(Boolean)
    .slice(0, 20);

  const marcadores = [];
  for (const nome of nomes) {
    const slug = gerarSlug(nome);
    if (!slug) continue;

    const marcador = await db.marcador.upsert({
      where: { slug },
      update: {},
      create: { nome, slug },
    });
    marcadores.push({ id: marcador.id });
  }

  return marcadores;
}

export async function salvarArtigo(
  _estadoAnterior: EstadoDoArtigo,
  dados: FormData,
): Promise<EstadoDoArtigo> {
  const sessao = await exigirQuemEscreve();

  const id = String(dados.get("id") ?? "").trim();
  const titulo = String(dados.get("titulo") ?? "").trim();
  const resumo = String(dados.get("resumo") ?? "").trim();
  const areaId = String(dados.get("areaId") ?? "").trim();
  const tipoId = String(dados.get("tipoId") ?? "").trim();
  const versaoSistema = String(dados.get("versaoSistema") ?? "").trim();
  const marcadoresDigitados = String(dados.get("marcadores") ?? "");
  const conteudoRecebido = String(dados.get("conteudoHtml") ?? "");
  const acao = String(dados.get("acao") ?? "salvar");

  if (titulo.length < 3) {
    return { erro: "O título precisa ter pelo menos 3 caracteres." };
  }

  const conteudoHtml = limparConteudo(conteudoRecebido);
  const conteudoTexto = htmlParaTexto(conteudoHtml);
  const buscaTexto = normalizar(`${titulo} ${resumo} ${conteudoTexto}`);

  if (acao === "publicar" && !podePublicar(sessao.papel)) {
    return { erro: "Seu perfil não pode publicar. Envie para revisão." };
  }

  if (acao === "publicar" && conteudoTexto.length < 20) {
    return { erro: "O documento está vazio demais para ser publicado." };
  }

  const situacao: SituacaoArtigo =
    acao === "publicar" ? "PUBLICADO" : acao === "enviar_revisao" ? "EM_REVISAO" : "RASCUNHO";

  const marcadores = await prepararMarcadores(marcadoresDigitados);

  // O endereço é gerado uma vez, na criação. Renomear o documento depois
  // não muda o link, que já pode ter sido compartilhado internamente.
  const existente = id ? await db.artigo.findUnique({ where: { id } }) : null;
  if (id && !existente) return { erro: "Documento não encontrado." };

  const camposComuns = {
    titulo,
    resumo: resumo || null,
    conteudoHtml,
    conteudoTexto,
    buscaTexto,
    situacao,
    areaId: areaId || null,
    tipoId: tipoId || null,
    versaoSistema: versaoSistema || null,
    ...(acao === "publicar"
      ? { publicadoEm: new Date(), revisorId: sessao.id, revisadoEm: new Date() }
      : {}),
  };

  const artigo = existente
    ? await db.artigo.update({
        where: { id: existente.id },
        data: { ...camposComuns, marcadores: { set: marcadores } },
      })
    : await db.artigo.create({
        data: {
          ...camposComuns,
          slug: await slugDisponivel(titulo),
          autorId: sessao.id,
          marcadores: { connect: marcadores },
        },
      });

  await registrar({
    acao: !existente ? "CRIACAO" : acao === "publicar" ? "PUBLICACAO" : "EDICAO",
    entidade: "artigo",
    entidadeId: artigo.id,
    descricao: `${
      !existente ? "Criou" : acao === "publicar" ? "Publicou" : "Editou"
    } o documento "${artigo.titulo}"`,
    autorId: sessao.id,
  });

  // O histórico guarda cada publicação, que é o que a equipe consome.
  if (acao === "publicar") {
    await db.versaoArtigo.create({
      data: {
        artigoId: artigo.id,
        titulo: artigo.titulo,
        conteudoHtml: artigo.conteudoHtml,
        autorId: sessao.id,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/artigos/${artigo.slug}`);

  redirect(acao === "publicar" ? `/artigos/${artigo.slug}` : `/admin/artigos/${artigo.id}`);
}

export async function alterarSituacao(id: string, situacao: SituacaoArtigo) {
  const sessao = await exigirQuemEscreve();

  if (situacao === "PUBLICADO" && !podePublicar(sessao.papel)) {
    throw new Error("Seu perfil não pode publicar.");
  }

  const artigo = await db.artigo.update({
    where: { id },
    data: {
      situacao,
      ...(situacao === "PUBLICADO"
        ? { publicadoEm: new Date(), revisorId: sessao.id, revisadoEm: new Date() }
        : {}),
    },
  });

  await registrar({
    acao: situacao === "PUBLICADO" ? "PUBLICACAO" : "EDICAO",
    entidade: "artigo",
    entidadeId: artigo.id,
    descricao: `Mudou a situação de "${artigo.titulo}" para ${situacao.toLowerCase().replace("_", " ")}`,
    autorId: sessao.id,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/artigos/${artigo.slug}`);
}

/**
 * Devolve o documento para ajuste, com a observação de quem revisou.
 * A situação volta para rascunho e o autor enxerga o que precisa mudar.
 */
export async function devolverParaAjuste(dados: FormData) {
  const sessao = await exigirQuemEscreve();

  if (!podePublicar(sessao.papel)) {
    throw new Error("Somente quem revisa pode devolver um documento.");
  }

  const id = String(dados.get("id") ?? "").trim();
  const texto = String(dados.get("texto") ?? "").trim();

  if (!id) return;
  if (texto.length < 5) {
    throw new Error("Escreva o que precisa ser ajustado antes de devolver.");
  }

  const artigo = await db.artigo.update({
    where: { id },
    data: {
      situacao: "RASCUNHO",
      revisorId: sessao.id,
      revisadoEm: new Date(),
      observacoes: { create: { texto, autorId: sessao.id } },
    },
  });

  await registrar({
    acao: "DEVOLUCAO",
    entidade: "artigo",
    entidadeId: artigo.id,
    descricao: `Devolveu "${artigo.titulo}" para ajuste`,
    autorId: sessao.id,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/artigos/${artigo.id}`);
}

/**
 * Traz de volta o conteúdo de uma versão anterior.
 *
 * A situação do documento não muda: se estava publicado, continua no ar
 * com o conteúdo restaurado, e o histórico ganha uma entrada nova. Nada
 * é apagado, então dá para voltar atrás outra vez.
 */
export async function restaurarVersao(dados: FormData) {
  const sessao = await exigirQuemEscreve();

  if (!podePublicar(sessao.papel)) {
    throw new Error("Somente quem revisa pode restaurar uma versão.");
  }

  const versaoId = String(dados.get("versaoId") ?? "").trim();
  if (!versaoId) return;

  const versao = await db.versaoArtigo.findUnique({ where: { id: versaoId } });
  if (!versao) throw new Error("Versão não encontrada.");

  const atual = await db.artigo.findUnique({ where: { id: versao.artigoId } });
  if (!atual) throw new Error("Documento não encontrado.");

  const conteudoHtml = limparConteudo(versao.conteudoHtml);
  const conteudoTexto = htmlParaTexto(conteudoHtml);

  const artigo = await db.artigo.update({
    where: { id: versao.artigoId },
    data: {
      titulo: versao.titulo,
      conteudoHtml,
      conteudoTexto,
      buscaTexto: normalizar(
        `${versao.titulo} ${atual.resumo ?? ""} ${conteudoTexto}`,
      ),
      revisorId: sessao.id,
      revisadoEm: new Date(),
    },
  });

  if (artigo.situacao === "PUBLICADO") {
    await db.versaoArtigo.create({
      data: {
        artigoId: artigo.id,
        titulo: artigo.titulo,
        conteudoHtml: artigo.conteudoHtml,
        comentario: "Restauração de uma versão anterior",
        autorId: sessao.id,
      },
    });
  }

  await registrar({
    acao: "RESTAURACAO",
    entidade: "artigo",
    entidadeId: artigo.id,
    descricao: `Restaurou uma versão anterior de "${artigo.titulo}"`,
    autorId: sessao.id,
  });

  revalidatePath("/");
  revalidatePath(`/artigos/${artigo.slug}`);
  revalidatePath(`/admin/artigos/${artigo.id}`);
  redirect(`/admin/artigos/${artigo.id}`);
}

/**
 * Sugestão vinda de quem lê. Qualquer pessoa da equipe pode apontar um
 * erro ou uma informação que faltou, sem precisar de permissão para
 * escrever. A sugestão fica registrada no documento e aparece para quem
 * edita, junto das observações de revisão.
 */
export async function sugerirCorrecao(dados: FormData) {
  const sessao = await exigirSessao();

  const id = String(dados.get("id") ?? "").trim();
  const texto = String(dados.get("texto") ?? "").trim();
  const slug = String(dados.get("slug") ?? "").trim();

  if (!id) return;
  if (texto.length < 5) {
    throw new Error("Escreva o que precisa ser corrigido.");
  }

  await db.observacaoDeRevisao.create({
    data: {
      artigoId: id,
      autorId: sessao.id,
      texto: `Sugestão de quem leu: ${texto}`,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/artigos/${id}`);
  if (slug) redirect(`/artigos/${slug}?sugestao=enviada`);
}

/** Marca a observação como resolvida, sem apagar o registro. */
export async function resolverObservacao(dados: FormData) {
  await exigirQuemEscreve();

  const id = String(dados.get("id") ?? "").trim();
  if (!id) return;

  const observacao = await db.observacaoDeRevisao.update({
    where: { id },
    data: { resolvidaEm: new Date() },
  });

  revalidatePath(`/admin/artigos/${observacao.artigoId}`);
}

export async function excluirArtigo(id: string) {
  const sessao = await exigirQuemEscreve();
  if (!podePublicar(sessao.papel)) {
    throw new Error("Somente quem revisa pode excluir um documento.");
  }

  const artigo = await db.artigo.findUnique({ where: { id } });
  await db.artigo.delete({ where: { id } });

  await registrar({
    acao: "EXCLUSAO",
    entidade: "artigo",
    entidadeId: id,
    descricao: `Excluiu o documento "${artigo?.titulo ?? id}"`,
    autorId: sessao.id,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}
