import type { Metadata } from "next";

import { CartaoDeNotaDeVersao } from "@/components/CartaoDeNotaDeVersao";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Notas de versão" };

export default async function PaginaDeNotasDeVersao({
  searchParams,
}: {
  searchParams: Promise<{ produto?: string }>;
}) {
  await exigirSessao();
  const { produto } = await searchParams;

  const [notas, produtos] = await Promise.all([
    db.notaDeVersao.findMany({
      where: { publicada: true, ...(produto ? { produto } : {}) },
      include: { itens: { orderBy: { ordem: "asc" } } },
      orderBy: [{ dataDeLancamento: "desc" }, { criadoEm: "desc" }],
      take: 100,
    }),
    db.notaDeVersao.findMany({
      where: { publicada: true },
      distinct: ["produto"],
      select: { produto: true },
      orderBy: { produto: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Notas de versão
        </h1>
        <p className="mt-1 text-slate-600">
          O que mudou em cada sistema, versão a versão.
        </p>
      </header>

      {produtos.length > 1 ? (
        <nav className="flex flex-wrap gap-1">
          <a
            href="/notas-de-versao"
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              !produto
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Todos
          </a>
          {produtos.map((linha) => (
            <a
              key={linha.produto}
              href={`/notas-de-versao?produto=${encodeURIComponent(linha.produto)}`}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                produto === linha.produto
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {linha.produto}
            </a>
          ))}
        </nav>
      ) : null}

      {notas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
          Nenhuma nota de versão publicada ainda.
        </p>
      ) : (
        <div className="space-y-4">
          {notas.map((nota) => (
            <CartaoDeNotaDeVersao
              key={nota.id}
              produto={nota.produto}
              versao={nota.versao}
              titulo={nota.titulo}
              descricao={nota.descricao}
              dataDeLancamento={nota.dataDeLancamento}
              itens={nota.itens}
            />
          ))}
        </div>
      )}
    </div>
  );
}
