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
      by: ["artigoId"],
      where: { resolveu: false },
      _count: { _all: true },
      orderBy: { _count: { artigoId: "desc" } },
      take: 10,
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

  const artigosMalAvaliados = await db.artigo.findMany({
    where: { id: { in: naoResolveram.map((linha) => linha.artigoId) } },
    select: { id: true, titulo: true },
  });

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

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-1 font-medium text-slate-900">Não resolveram o problema</h3>
          <p className="mb-3 text-sm text-slate-600">
            Documentos que a equipe leu e disse que não ajudaram.
          </p>

          {naoResolveram.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma avaliação negativa.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {naoResolveram.map((linha) => {
                const artigo = artigosMalAvaliados.find((a) => a.id === linha.artigoId);
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
                    <span className="whitespace-nowrap text-xs text-red-700">
                      {linha._count._all}{" "}
                      {linha._count._all === 1 ? "resposta" : "respostas"}
                    </span>
                  </li>
                );
              })}
            </ul>
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
