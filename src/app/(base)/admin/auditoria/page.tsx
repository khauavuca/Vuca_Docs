import Link from "next/link";
import type { Metadata } from "next";
import type { TipoDeAcao } from "@prisma/client";

import { db } from "@/lib/db";
import { exigirAdministrador } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Histórico da base" };

const ROTULO_DA_ACAO: Record<TipoDeAcao, string> = {
  CRIACAO: "Criação",
  EDICAO: "Edição",
  PUBLICACAO: "Publicação",
  DEVOLUCAO: "Devolução",
  RESTAURACAO: "Restauração",
  EXCLUSAO: "Exclusão",
  ACESSO_ALTERADO: "Acesso",
};

const COR_DA_ACAO: Record<TipoDeAcao, string> = {
  CRIACAO: "bg-slate-100 text-slate-700",
  EDICAO: "bg-slate-100 text-slate-700",
  PUBLICACAO: "bg-emerald-100 text-emerald-800",
  DEVOLUCAO: "bg-amber-100 text-amber-900",
  RESTAURACAO: "bg-blue-100 text-blue-800",
  EXCLUSAO: "bg-red-100 text-red-800",
  ACESSO_ALTERADO: "bg-purple-100 text-purple-800",
};

const FILTROS = [
  { chave: "todos", rotulo: "Tudo" },
  { chave: "artigo", rotulo: "Documentos" },
  { chave: "area", rotulo: "Áreas e tipos" },
  { chave: "usuario", rotulo: "Contas" },
];

export default async function PaginaDeAuditoria({
  searchParams,
}: {
  searchParams: Promise<{ entidade?: string }>;
}) {
  await exigirAdministrador();

  const { entidade } = await searchParams;
  const filtro = entidade && entidade !== "todos" ? entidade : null;

  const registros = await db.registroDeAuditoria.findMany({
    where: filtro
      ? filtro === "area"
        ? { entidade: { in: ["area", "tipo"] } }
        : { entidade: filtro }
      : {},
    include: { autor: { select: { nome: true } } },
    orderBy: { criadoEm: "desc" },
    take: 300,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-medium text-slate-900">Histórico da base</h2>
        <p className="text-sm text-slate-600">
          Quem publicou, editou, excluiu e quem mexeu em acesso. O registro
          não é apagado pela plataforma.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {FILTROS.map((opcao) => {
          const ativo = (opcao.chave === "todos" && !filtro) || opcao.chave === filtro;

          return (
            <Link
              key={opcao.chave}
              href={`/admin/auditoria?entidade=${opcao.chave}`}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                ativo
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {opcao.rotulo}
            </Link>
          );
        })}
      </div>

      {registros.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          Nenhum registro ainda.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">Quem</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">O que aconteceu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registros.map((registro) => (
                <tr key={registro.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(registro.criadoEm)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {registro.autor?.nome ?? "Conta removida"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${COR_DA_ACAO[registro.acao]}`}
                    >
                      {ROTULO_DA_ACAO[registro.acao]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {registro.entidade === "artigo" && registro.entidadeId ? (
                      <Link
                        href={`/admin/artigos/${registro.entidadeId}`}
                        className="hover:text-blue-700"
                      >
                        {registro.descricao}
                      </Link>
                    ) : (
                      registro.descricao
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
