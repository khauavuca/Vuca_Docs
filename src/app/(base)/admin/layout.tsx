import Link from "next/link";

import { podeAdministrar, podePublicar } from "@/lib/sessao";
import { exigirQuemEscreve } from "@/lib/sessaoServidor";

export default async function LayoutDaAdministracao({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await exigirQuemEscreve();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Administração
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Escreva, revise e organize o conteúdo da base.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-slate-200">
        <Link
          href="/admin"
          className="rounded-t-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Documentos
        </Link>
        <Link
          href="/admin/importar"
          className="rounded-t-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Importar documento
        </Link>
        <Link
          href="/admin/saude"
          className="rounded-t-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Saúde do acervo
        </Link>
        {podePublicar(sessao.papel) ? (
          <>
            <Link
              href="/admin/comunicados"
              className="rounded-t-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Comunicados
            </Link>
            <Link
              href="/admin/notas-de-versao"
              className="rounded-t-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Notas de versão
            </Link>
          </>
        ) : null}
        {podeAdministrar(sessao.papel) ? (
          <>
            <Link
              href="/admin/estrutura"
              className="rounded-t-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Áreas e tipos
            </Link>
            <Link
              href="/admin/usuarios"
              className="rounded-t-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Pessoas
            </Link>
            <Link
              href="/admin/auditoria"
              className="rounded-t-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Histórico
            </Link>
          </>
        ) : null}
      </nav>

      {children}
    </div>
  );
}
