import type { Metadata } from "next";

import {
  alternarPublicacaoDaNota,
  excluirNotaDeVersao,
} from "@/actions/notasDeVersao";
import { CartaoDeNotaDeVersao } from "@/components/CartaoDeNotaDeVersao";
import { FormularioDeNotaDeVersao } from "@/components/FormularioDeNotaDeVersao";
import { db } from "@/lib/db";
import { exigirQuemPublica } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Notas de versão" };

export default async function PaginaDeAdminDeNotasDeVersao() {
  await exigirQuemPublica();

  const notas = await db.notaDeVersao.findMany({
    include: { itens: { orderBy: { ordem: "asc" } } },
    orderBy: [{ criadoEm: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-1 font-medium text-slate-900">Nova versão</h2>
        <p className="mb-4 text-sm text-slate-600">
          Mesma estrutura do relatório de Release Notes do Jira: produto,
          versão, data, e os itens agrupados por tipo.
        </p>

        <FormularioDeNotaDeVersao />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Lançadas
        </h2>

        {notas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            Nenhuma nota de versão criada ainda.
          </p>
        ) : (
          notas.map((nota) => (
            <div key={nota.id} className="space-y-2">
              <CartaoDeNotaDeVersao
                produto={nota.produto}
                versao={nota.versao}
                titulo={nota.titulo}
                descricao={nota.descricao}
                dataDeLancamento={nota.dataDeLancamento}
                publicada={nota.publicada}
                itens={nota.itens}
              />

              <div className="flex gap-2">
                <form action={alternarPublicacaoDaNota}>
                  <input type="hidden" name="id" value={nota.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {nota.publicada ? "Tirar do ar" : "Publicar"}
                  </button>
                </form>

                <form action={excluirNotaDeVersao}>
                  <input type="hidden" name="id" value={nota.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50"
                  >
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
