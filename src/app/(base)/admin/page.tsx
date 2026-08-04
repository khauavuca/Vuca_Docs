import Link from "next/link";
import type { Metadata } from "next";
import type { SituacaoArtigo } from "@prisma/client";
import { Plus } from "lucide-react";

import { db } from "@/lib/db";
import { exigirQuemEscreve } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Documentos" };

const ROTULO_DA_SITUACAO: Record<SituacaoArtigo, string> = {
  RASCUNHO: "Rascunho",
  EM_REVISAO: "Em revisão",
  PUBLICADO: "Publicado",
  DESATUALIZADO: "Desatualizado",
};

const COR_DA_SITUACAO: Record<SituacaoArtigo, string> = {
  RASCUNHO: "bg-slate-100 text-slate-700",
  EM_REVISAO: "bg-blue-100 text-blue-800",
  PUBLICADO: "bg-emerald-100 text-emerald-800",
  DESATUALIZADO: "bg-amber-100 text-amber-900",
};

const FILTROS: Array<{ chave: string; rotulo: string }> = [
  { chave: "todos", rotulo: "Todos" },
  { chave: "RASCUNHO", rotulo: "Rascunhos" },
  { chave: "EM_REVISAO", rotulo: "Em revisão" },
  { chave: "PUBLICADO", rotulo: "Publicados" },
  { chave: "DESATUALIZADO", rotulo: "Desatualizados" },
];

export default async function PaginaDeDocumentos({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string }>;
}) {
  await exigirQuemEscreve();

  const { situacao } = await searchParams;
  const filtroAtivo = situacao && situacao !== "todos" ? (situacao as SituacaoArtigo) : null;

  const artigos = await db.artigo.findMany({
    where: filtroAtivo ? { situacao: filtroAtivo } : {},
    include: {
      area: true,
      tipo: true,
      autor: { select: { nome: true } },
      _count: { select: { observacoes: { where: { resolvidaEm: null } } } },
    },
    orderBy: { atualizadoEm: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {FILTROS.map((filtro) => {
            const ativo =
              (filtro.chave === "todos" && !filtroAtivo) || filtro.chave === filtroAtivo;

            return (
              <Link
                key={filtro.chave}
                href={`/admin?situacao=${filtro.chave}`}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  ativo
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {filtro.rotulo}
              </Link>
            );
          })}
        </div>

        <Link
          href="/admin/artigos/novo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <Plus aria-hidden className="size-4" />
          Novo documento
        </Link>
      </div>

      {artigos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          Nenhum documento por aqui ainda.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Área</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Tipo</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Atualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {artigos.map((artigo) => (
                <tr key={artigo.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/artigos/${artigo.id}`}
                      className="font-medium text-slate-900 hover:text-blue-700"
                    >
                      {artigo.titulo}
                    </Link>

                    {artigo._count.observacoes > 0 ? (
                      <span className="ml-2 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                        {artigo._count.observacoes === 1
                          ? "1 pendência"
                          : `${artigo._count.observacoes} pendências`}
                      </span>
                    ) : null}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                    {artigo.area?.nome ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">
                    {artigo.tipo?.nome ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${COR_DA_SITUACAO[artigo.situacao]}`}
                    >
                      {ROTULO_DA_SITUACAO[artigo.situacao]}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
                      artigo.atualizadoEm,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
