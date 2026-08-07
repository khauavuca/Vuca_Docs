import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, Trash2 } from "lucide-react";

import { excluirApresentacao } from "@/actions/apresentacoes";
import { FormularioDeApresentacao } from "@/components/FormularioDeApresentacao";
import { listarApresentacoes } from "@/lib/consultas";
import { exigirQuemEscreve } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Apresentações" };

const formatarData = (data: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(data);

export default async function PaginaDeAdminDeApresentacoes() {
  await exigirQuemEscreve();

  const apresentacoes = await listarApresentacoes();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-1 font-medium text-slate-900">Nova apresentação</h2>
        <p className="mb-4 text-sm text-slate-600">
          O deck já vem pronto de fora — só envia o arquivo .html. Não passa
          pelo editor da base.
        </p>

        <FormularioDeApresentacao />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Enviadas</h2>

        {apresentacoes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            Nenhuma apresentação enviada ainda.
          </p>
        ) : (
          apresentacoes.map((apresentacao) => (
            <div
              key={apresentacao.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{apresentacao.titulo}</p>
                <p className="text-sm text-slate-500">
                  {apresentacao.autor?.nome ?? "Equipe Vuca"} ·{" "}
                  {formatarData(apresentacao.criadoEm)}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/apresentacoes/${apresentacao.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <ExternalLink aria-hidden className="size-3.5" />
                  Abrir
                </Link>

                <form action={excluirApresentacao}>
                  <input type="hidden" name="id" value={apresentacao.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50"
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                    Excluir
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
