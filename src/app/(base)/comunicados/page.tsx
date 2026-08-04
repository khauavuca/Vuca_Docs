import type { Metadata } from "next";

import { CartaoDeComunicado } from "@/components/CartaoDeComunicado";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Comunicados" };

export default async function PaginaDeComunicados() {
  await exigirSessao();

  const comunicados = await db.comunicado.findMany({
    orderBy: [{ fixado: "desc" }, { criadoEm: "desc" }],
    include: { autor: { select: { nome: true } } },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Comunicados
        </h1>
        <p className="mt-1 text-slate-600">
          Avisos da equipe: mudança de procedimento, versão nova, alerta de
          indisponibilidade.
        </p>
      </header>

      {comunicados.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
          Nenhum comunicado publicado ainda.
        </p>
      ) : (
        <div className="grid gap-3">
          {comunicados.map((comunicado) => (
            <CartaoDeComunicado
              key={comunicado.id}
              titulo={comunicado.titulo}
              corpo={comunicado.corpo}
              autor={comunicado.autor?.nome}
              criadoEm={comunicado.criadoEm}
              fixado={comunicado.fixado}
            />
          ))}
        </div>
      )}
    </div>
  );
}
