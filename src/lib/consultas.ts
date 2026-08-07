import type { SituacaoArtigo } from "@prisma/client";

import { db } from "@/lib/db";
import { normalizar } from "@/lib/texto";

/** O que a equipe enxerga na leitura. Rascunho e revisão ficam de fora. */
export const SITUACOES_VISIVEIS: SituacaoArtigo[] = ["PUBLICADO", "DESATUALIZADO"];

/**
 * Monta a árvore do menu lateral com a quantidade de artigos visíveis
 * em cada área. A contagem é feita em uma consulta só, agrupada.
 */
export async function arvoreDeAreas() {
  const [areas, contagens] = await Promise.all([
    db.area.findMany({
      where: { arquivada: false },
      include: { filhas: { where: { arquivada: false }, orderBy: [{ ordem: "asc" }, { nome: "asc" }] } },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    }),
    db.artigo.groupBy({
      by: ["areaId"],
      where: { situacao: { in: SITUACOES_VISIVEIS } },
      _count: { _all: true },
    }),
  ]);

  const porArea = new Map<string, number>();
  for (const linha of contagens) {
    if (linha.areaId) porArea.set(linha.areaId, linha._count._all);
  }

  return areas
    .filter((area) => area.paiId === null)
    .map((area) => {
      const filhasComContagem = area.filhas.map((filha) => ({
        ...filha,
        quantidade: porArea.get(filha.id) ?? 0,
      }));

      const somaDasFilhas = filhasComContagem.reduce((total, f) => total + f.quantidade, 0);

      return {
        ...area,
        quantidade: (porArea.get(area.id) ?? 0) + somaDasFilhas,
        filhasComContagem,
      };
    });
}

export async function obterAreaPorSlug(slug: string) {
  return db.area.findUnique({
    where: { slug },
    include: {
      pai: true,
      filhas: { where: { arquivada: false }, orderBy: [{ ordem: "asc" }, { nome: "asc" }] },
    },
  });
}

/** Artigos de uma área, incluindo os das subáreas. */
export async function listarArtigosDaArea(areaId: string, idsDasFilhas: string[] = []) {
  return db.artigo.findMany({
    where: {
      situacao: { in: SITUACOES_VISIVEIS },
      areaId: { in: [areaId, ...idsDasFilhas] },
    },
    include: { tipo: true, area: true, marcadores: true },
    orderBy: [{ titulo: "asc" }],
  });
}

export async function obterArtigoPorSlug(slug: string) {
  return db.artigo.findUnique({
    where: { slug },
    include: {
      area: { include: { pai: true } },
      tipo: true,
      marcadores: true,
      autor: { select: { nome: true } },
      revisor: { select: { nome: true } },
    },
  });
}

export async function artigosRecentes(limite = 8) {
  return db.artigo.findMany({
    where: { situacao: { in: SITUACOES_VISIVEIS } },
    include: { area: true, tipo: true },
    orderBy: [{ publicadoEm: "desc" }, { atualizadoEm: "desc" }],
    take: limite,
  });
}

export async function listarArtigosPorMarcador(slug: string) {
  return db.artigo.findMany({
    where: {
      situacao: { in: SITUACOES_VISIVEIS },
      marcadores: { some: { slug } },
    },
    include: { area: true, tipo: true, marcadores: true },
    orderBy: [{ titulo: "asc" }],
  });
}

/**
 * Busca dentro do conteúdo. Cada palavra digitada precisa aparecer no
 * texto normalizado do artigo, o que dispensa extensão no banco e já
 * ignora acento e maiúscula. O volume previsto cabe nesta abordagem.
 */
export async function buscarArtigos(termo: string, filtros?: { tipoSlug?: string; areaSlug?: string }) {
  const palavras = normalizar(termo).split(/\s+/).filter((p) => p.length > 1);
  if (palavras.length === 0) return [];

  const artigos = await db.artigo.findMany({
    where: {
      situacao: { in: SITUACOES_VISIVEIS },
      AND: palavras.map((palavra) => ({ buscaTexto: { contains: palavra } })),
      ...(filtros?.tipoSlug ? { tipo: { slug: filtros.tipoSlug } } : {}),
      // Filtrar por uma área principal inclui o que está nas subáreas:
      // quem procura em Integrações espera achar o que é da Valori.
      ...(filtros?.areaSlug
        ? {
            area: {
              is: {
                OR: [
                  { slug: filtros.areaSlug },
                  { pai: { is: { slug: filtros.areaSlug } } },
                ],
              },
            },
          }
        : {}),
    },
    include: { area: true, tipo: true, marcadores: true },
    take: 60,
  });

  const termoNormalizado = normalizar(termo);

  // Ranqueia de forma simples: o que aparece no título vale mais.
  return artigos
    .map((artigo) => {
      const titulo = normalizar(artigo.titulo);
      const resumo = normalizar(artigo.resumo ?? "");

      let pontos = 0;
      if (titulo.includes(termoNormalizado)) pontos += 10;
      if (resumo.includes(termoNormalizado)) pontos += 5;
      for (const palavra of palavras) {
        if (titulo.includes(palavra)) pontos += 3;
        if (resumo.includes(palavra)) pontos += 1;
      }

      return { artigo, pontos };
    })
    .sort((a, b) => b.pontos - a.pontos || a.artigo.titulo.localeCompare(b.artigo.titulo))
    .map((linha) => linha.artigo);
}

/** Lista achatada de áreas, com o nível, para usar nos campos de seleção. */
export async function opcoesDeArea() {
  const areas = await db.area.findMany({
    where: { arquivada: false },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
  });

  const raizes = areas.filter((area) => area.paiId === null);

  return raizes.flatMap((raiz) => [
    { id: raiz.id, nome: raiz.nome, nivel: 0 },
    ...areas
      .filter((area) => area.paiId === raiz.id)
      .map((filha) => ({ id: filha.id, nome: filha.nome, nivel: 1 })),
  ]);
}

export async function listarTipos() {
  return db.tipo.findMany({ orderBy: [{ ordem: "asc" }, { nome: "asc" }] });
}

export async function listarMarcadores() {
  return db.marcador.findMany({ orderBy: { nome: "asc" } });
}

export async function listarApresentacoes() {
  return db.apresentacao.findMany({
    orderBy: { criadoEm: "desc" },
    include: { autor: { select: { nome: true } } },
  });
}

export async function obterApresentacaoPorSlug(slug: string) {
  return db.apresentacao.findUnique({
    where: { slug },
    include: { anexo: true },
  });
}
