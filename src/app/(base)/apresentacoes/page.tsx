import Link from "next/link";
import type { Metadata } from "next";
import { Presentation, Plus } from "lucide-react";

import { listarApresentacoes } from "@/lib/consultas";
import { podeEscrever } from "@/lib/sessao";
import { exigirSessao } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Apresentações" };

const formatarData = (data: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(data);

export default async function PaginaDeApresentacoes() {
  const sessao = await exigirSessao();
  const apresentacoes = await listarApresentacoes();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Apresentações</h1>
          <p className="mt-1 text-sm text-slate-600">
            Slides prontos, em tela cheia — treinamentos, decks de novidades.
          </p>
        </div>

        {podeEscrever(sessao.papel) ? (
          <Link
            href="/admin/apresentacoes"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            <Plus aria-hidden className="size-4" />
            Enviar apresentação
          </Link>
        ) : null}
      </div>

      {apresentacoes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          Nenhuma apresentação enviada ainda.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {apresentacoes.map((apresentacao) => (
            <Link
              key={apresentacao.id}
              href={`/apresentacoes/${apresentacao.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm"
            >
              <Presentation aria-hidden className="size-5 text-blue-700" />
              <p className="mt-2 font-medium text-slate-900 group-hover:text-blue-800">
                {apresentacao.titulo}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {apresentacao.autor?.nome ?? "Equipe Vuca"} ·{" "}
                {formatarData(apresentacao.criadoEm)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
