import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { exigirQuemEscreve } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Saúde do acervo" };

const SEIS_MESES_EM_MS = 1000 * 60 * 60 * 24 * 182;

function Cartao({
  titulo,
  valor,
  detalhe,
}: {
  titulo: string;
  valor: number;
  detalhe: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{valor}</p>
      <p className="mt-0.5 text-xs text-slate-500">{detalhe}</p>
    </div>
  );
}

export default async function PaginaDeSaude() {
  await exigirQuemEscreve();

  const limiteDeRevisao = new Date(Date.now() - SEIS_MESES_EM_MS);

  const [
    publicados,
    rascunhos,
    emRevisao,
    desatualizados,
    semRevisaoRecente,
    pendencias,
    buscasVazias,
    naoResolveram,
    semArea,
  ] = await Promise.all([
    db.artigo.count({ where: { situacao: "PUBLICADO" } }),
    db.artigo.count({ where: { situacao: "RASCUNHO" } }),
    db.artigo.count({ where: { situacao: "EM_REVISAO" } }),
    db.artigo.count({ where: { situacao: "DESATUALIZADO" } }),
    db.artigo.findMany({
      where: { situacao: "PUBLICADO", atualizadoEm: { lt: limiteDeRevisao } },
      select: { id: true, titulo: true, atualizadoEm: true },
      orderBy: { atualizadoEm: "asc" },
      take: 10,
    }),
    db.observacaoDeRevisao.count({ where: { resolvidaEm: null } }),
    db.buscaSemResultado.groupBy({
      by: ["termo"],
      _count: { _all: true },
      orderBy: { _count: { termo: "desc" } },
      take: 15,
    }),
    db.avaliacaoDeArtigo.groupBy({
      by: ["artigoId", "resolveu"],
      _count: { _all: true },
    }),
    db.artigo.count({ where: { areaId: null } }),
  ]);

  const maisConsultados = await db.leituraDeArtigo.groupBy({
    by: ["artigoId"],
    _sum: { vezes: true },
    orderBy: { _sum: { vezes: "desc" } },
    take: 10,
  });

  const artigosConsultados = await db.artigo.findMany({
    where: { id: { in: maisConsultados.map((linha) => linha.artigoId) } },
    select: { id: true, titulo: true },
  });

  const pendenciasPorArtigo = await db.observacaoDeRevisao.groupBy({
    by: ["artigoId"],
    where: { resolvidaEm: null },
    _count: { _all: true },
  });

  // Uma linha por documento, juntando sim, não e pendências abertas —
  // a visão completa de utilidade, não só a lista de reprovados.
  type ResumoDeUtilidade = { sim: number; nao: number; pendencias: number };
  const resumoPorArtigo = new Map<string, ResumoDeUtilidade>();

  const obterResumo = (id: string): ResumoDeUtilidade => {
    const existente = resumoPorArtigo.get(id);
    if (existente) return existente;
    const novo = { sim: 0, nao: 0, pendencias: 0 };
    resumoPorArtigo.set(id, novo);
    return novo;
  };

  for (const linha of naoResolveram) {
    const resumo = obterResumo(linha.artigoId);
    if (linha.resolveu) resumo.sim = linha._count._all;
    else resumo.nao = linha._count._all;
  }

  for (const linha of pendenciasPorArtigo) {
    obterResumo(linha.artigoId).pendencias = linha._count._all;
  }

  const artigosComUtilidade = await db.artigo.findMany({
    where: { id: { in: [...resumoPorArtigo.keys()] } },
    select: { id: true, titulo: true },
  });

  const utilidadePorDocumento = artigosComUtilidade
    .map((artigo) => ({ artigo, ...obterResumo(artigo.id) }))
    .sort((a, b) => b.sim + b.nao + b.pendencias - (a.sim + a.nao + a.pendencias))
    .slice(0, 20);

  const formatar = (data: Date) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(data);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-medium text-slate-900">Saúde do acervo</h2>
        <p className="text-sm text-slate-600">
          O que a base já cobre, o que envelheceu e o que a equipe procura
          sem encontrar.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Cartao titulo="Publicados" valor={publicados} detalhe="No ar para a equipe" />
        <Cartao titulo="Rascunhos" valor={rascunhos} detalhe="Ainda não publicados" />
        <Cartao titulo="Em revisão" valor={emRevisao} detalhe="Esperando aprovação" />
        <Cartao
          titulo="Desatualizados"
          valor={desatualizados}
          detalhe="Marcados para conferir"
        />
        <Cartao
          titulo="Pendências"
          valor={pendencias}
          detalhe="Ajustes e sugestões em aberto"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-1 font-medium text-slate-900">
            Procurado e não encontrado
          </h3>
          <p className="mb-3 text-sm text-slate-600">
            Esta é a melhor fila de trabalho que existe: são as buscas da
            equipe que voltaram vazias.
          </p>

          {buscasVazias.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma busca sem resultado até agora.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {buscasVazias.map((linha) => (
                <li key={linha.termo} className="flex items-center justify-between gap-3">
                  <span className="text-slate-700">{linha.termo}</span>
                  <span className="text-xs text-slate-400">
                    {linha._count._all}{" "}
                    {linha._count._all === 1 ? "vez" : "vezes"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-1 font-medium text-slate-900">Sem revisão há mais de 6 meses</h3>
          <p className="mb-3 text-sm text-slate-600">
            Documento antigo continua sendo seguido pela equipe, mesmo
            quando o sistema já mudou.
          </p>

          {semRevisaoRecente.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum documento publicado passou desse prazo.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {semRevisaoRecente.map((artigo) => (
                <li key={artigo.id} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/admin/artigos/${artigo.id}`}
                    className="text-slate-700 hover:text-blue-700"
                  >
                    {artigo.titulo}
                  </Link>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {formatar(artigo.atualizadoEm)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-1 font-medium text-slate-900">Mais consultados</h3>
          <p className="mb-3 text-sm text-slate-600">
            O que a equipe abre no dia a dia. São estes que mais custam
            caro quando ficam desatualizados.
          </p>

          {maisConsultados.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma consulta registrada ainda.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {maisConsultados.map((linha) => {
                const artigo = artigosConsultados.find((a) => a.id === linha.artigoId);
                if (!artigo) return null;

                return (
                  <li
                    key={linha.artigoId}
                    className="flex items-center justify-between gap-3"
                  >
                    <Link
                      href={`/admin/artigos/${artigo.id}`}
                      className="text-slate-700 hover:text-blue-700"
                    >
                      {artigo.titulo}
                    </Link>
                    <span className="whitespace-nowrap text-xs text-slate-400">
                      {linha._sum.vezes ?? 0}{" "}
                      {(linha._sum.vezes ?? 0) === 1 ? "consulta" : "consultas"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <h3 className="mb-1 font-medium text-slate-900">Utilidade por documento</h3>
          <p className="mb-3 text-sm text-slate-600">
            O que a equipe realmente diz sobre cada documento: quantos
            confirmaram que resolveu, quantos disseram que não, e quantas
            sugestões de leitor ainda estão em aberto.
          </p>

          {utilidadePorDocumento.length === 0 ? (
            <p className="text-sm text-slate-500">
              Ainda não há avaliação nem sugestão registrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">Documento</th>
                    <th className="pb-2 pr-3 font-medium">Sim</th>
                    <th className="pb-2 pr-3 font-medium">Não</th>
                    <th className="pb-2 pr-3 font-medium">% útil</th>
                    <th className="pb-2 font-medium">Pendências</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {utilidadePorDocumento.map(({ artigo, sim, nao, pendencias }) => {
                    const total = sim + nao;
                    const percentualUtil = total > 0 ? Math.round((sim / total) * 100) : null;

                    return (
                      <tr key={artigo.id}>
                        <td className="py-2 pr-3">
                          <Link
                            href={`/admin/artigos/${artigo.id}`}
                            className="text-slate-700 hover:text-blue-700"
                          >
                            {artigo.titulo}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 text-emerald-700">{sim || "—"}</td>
                        <td className="py-2 pr-3 text-red-700">{nao || "—"}</td>
                        <td className="py-2 pr-3">
                          {percentualUtil === null ? (
                            <span className="text-slate-400">Sem votos</span>
                          ) : (
                            <span
                              className={
                                percentualUtil < 50 ? "font-medium text-red-700" : "text-slate-700"
                              }
                            >
                              {percentualUtil}%
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          {pendencias > 0 ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                              {pendencias}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-1 font-medium text-slate-900">Organização</h3>
          <p className="mb-3 text-sm text-slate-600">
            Documento sem área não aparece na navegação lateral. Só é
            encontrado pela busca.
          </p>

          <p className="text-sm text-slate-700">
            {semArea === 0
              ? "Todos os documentos estão classificados em uma área."
              : `${semArea} ${semArea === 1 ? "documento está" : "documentos estão"} sem área.`}
          </p>

          {semArea > 0 ? (
            <Link
              href="/admin"
              className="mt-2 inline-block text-sm text-blue-700 hover:underline"
            >
              Ver a lista de documentos
            </Link>
          ) : null}
        </section>
      </div>
    </div>
  );
}
