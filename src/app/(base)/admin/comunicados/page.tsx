import type { Metadata } from "next";

import {
  alternarFixado,
  criarComunicado,
  excluirComunicado,
} from "@/actions/comunicados";
import { CartaoDeComunicado } from "@/components/CartaoDeComunicado";
import { db } from "@/lib/db";
import { exigirQuemPublica } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Comunicados" };

const CAMPO =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

export default async function PaginaDeAdminDeComunicados() {
  await exigirQuemPublica();

  const comunicados = await db.comunicado.findMany({
    orderBy: [{ fixado: "desc" }, { criadoEm: "desc" }],
    include: { autor: { select: { nome: true } } },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-1 font-medium text-slate-900">Novo comunicado</h2>
        <p className="mb-4 text-sm text-slate-600">
          Aviso curto, para ser lido em dez segundos. O que precisa de
          explicação longa vira documento.
        </p>

        <form action={criarComunicado} className="space-y-3">
          <div>
            <label htmlFor="titulo" className="mb-1.5 block text-sm font-medium text-slate-700">
              Título
            </label>
            <input id="titulo" name="titulo" required className={CAMPO} />
          </div>

          <div>
            <label htmlFor="corpo" className="mb-1.5 block text-sm font-medium text-slate-700">
              Mensagem
            </label>
            <textarea id="corpo" name="corpo" rows={4} required className={CAMPO} />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="fixado"
              value="sim"
              className="size-4 rounded border-slate-300"
            />
            Fixar no topo da página inicial
          </label>

          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Publicar comunicado
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Publicados
        </h2>

        {comunicados.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            Nenhum comunicado ainda.
          </p>
        ) : (
          comunicados.map((comunicado) => (
            <div key={comunicado.id} className="space-y-2">
              <CartaoDeComunicado
                titulo={comunicado.titulo}
                corpo={comunicado.corpo}
                autor={comunicado.autor?.nome}
                criadoEm={comunicado.criadoEm}
                fixado={comunicado.fixado}
              />

              <div className="flex gap-2">
                <form action={alternarFixado}>
                  <input type="hidden" name="id" value={comunicado.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {comunicado.fixado ? "Desafixar" : "Fixar no topo"}
                  </button>
                </form>

                <form action={excluirComunicado}>
                  <input type="hidden" name="id" value={comunicado.id} />
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
