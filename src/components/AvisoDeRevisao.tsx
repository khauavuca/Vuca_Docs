import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

import { db } from "@/lib/db";

/**
 * Aviso de documentos esperando revisão, visível assim que a pessoa
 * entra — sem precisar abrir a Administração e clicar no filtro certo
 * para descobrir que existe trabalho pendente.
 */
export async function AvisoDeRevisao() {
  const pendentes = await db.artigo.findMany({
    where: { situacao: "EM_REVISAO" },
    select: { id: true, titulo: true, autor: { select: { nome: true } } },
    orderBy: { atualizadoEm: "asc" },
    take: 5,
  });

  if (pendentes.length === 0) return null;

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-blue-900">
        <ClipboardCheck aria-hidden className="size-4" />
        {pendentes.length === 1
          ? "1 documento aguardando sua revisão"
          : `${pendentes.length} documentos aguardando sua revisão`}
      </p>
      <ul className="space-y-1">
        {pendentes.map((artigo) => (
          <li key={artigo.id} className="text-sm">
            <Link
              href={`/admin/artigos/${artigo.id}`}
              className="text-blue-800 hover:underline"
            >
              {artigo.titulo}
            </Link>
            {artigo.autor ? (
              <span className="ml-1.5 text-xs text-blue-600">— {artigo.autor.nome}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
