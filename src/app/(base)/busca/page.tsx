import Link from "next/link";
import type { Metadata } from "next";

import { CartaoDeArtigo } from "@/components/CartaoDeArtigo";
import { RegistroDeBuscaVazia } from "@/components/RegistroDeBuscaVazia";
import { buscarArtigos, listarTipos, opcoesDeArea } from "@/lib/consultas";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/sessaoServidor";
import { trechoComTermo } from "@/lib/texto";

export const metadata: Metadata = { title: "Busca" };

const CAMPO =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600";

export default async function PaginaDeBusca({
  searchParams,
}: {
  searchParams: Promise<{ termo?: string; area?: string; tipo?: string }>;
}) {
  await exigirSessao();

  const { termo, area, tipo } = await searchParams;
  const procurado = (termo ?? "").trim();

  const [tipos, areas] = await Promise.all([listarTipos(), opcoesDeArea()]);

  // As opções de área vêm sem o endereço, e o filtro trabalha com ele.
  const areasComSlug = await db.area.findMany({
    where: { arquivada: false },
    select: { id: true, slug: true },
  });
  const slugPorId = new Map(areasComSlug.map((a) => [a.id, a.slug]));

  const resultados =
    procurado.length > 1
      ? await buscarArtigos(procurado, { areaSlug: area, tipoSlug: tipo })
      : [];

  const temFiltro = Boolean(area || tipo);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Resultados da busca
        </h1>
        {procurado ? (
          <p className="mt-1 text-slate-600">
            {resultados.length === 0
              ? "Nenhum documento encontrado para "
              : `${resultados.length} ${
                  resultados.length === 1 ? "documento encontrado" : "documentos encontrados"
                } para `}
            <span className="font-medium text-slate-900">“{procurado}”</span>
          </p>
        ) : (
          <p className="mt-1 text-slate-600">
            Digite ao menos duas letras no campo de busca.
          </p>
        )}
      </header>

      {procurado ? (
        <form
          method="get"
          className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <input type="hidden" name="termo" value={procurado} />

          <div>
            <label htmlFor="area" className="mb-1.5 block text-xs font-medium text-slate-600">
              Área
            </label>
            <select id="area" name="area" defaultValue={area ?? ""} className={CAMPO}>
              <option value="">Todas as áreas</option>
              {areas.map((opcao) => (
                <option key={opcao.id} value={slugPorId.get(opcao.id) ?? ""}>
                  {opcao.nivel > 0 ? `— ${opcao.nome}` : opcao.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tipo" className="mb-1.5 block text-xs font-medium text-slate-600">
              Tipo de documento
            </label>
            <select id="tipo" name="tipo" defaultValue={tipo ?? ""} className={CAMPO}>
              <option value="">Todos os tipos</option>
              {tipos.map((opcao) => (
                <option key={opcao.id} value={opcao.slug}>
                  {opcao.nome}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Filtrar
          </button>

          {temFiltro ? (
            <Link
              href={`/busca?termo=${encodeURIComponent(procurado)}`}
              className="text-sm text-slate-600 hover:text-blue-700"
            >
              Limpar filtros
            </Link>
          ) : null}
        </form>
      ) : null}

      {procurado && resultados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          {/* Só conta como lacuna do acervo quando a busca é sem filtro. */}
          {temFiltro ? null : <RegistroDeBuscaVazia termo={procurado} />}

          <p className="font-medium text-slate-900">Nada encontrado</p>
          <p className="mt-1">
            {temFiltro
              ? "Nenhum documento com esses filtros. Tente limpar os filtros e procurar de novo."
              : "Tente descrever o problema com outras palavras, ou procure pela mensagem de erro exata que aparece na tela."}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3">
        {resultados.map((artigo) => (
          <CartaoDeArtigo
            key={artigo.id}
            slug={artigo.slug}
            titulo={artigo.titulo}
            area={artigo.area}
            tipo={artigo.tipo}
            desatualizado={artigo.situacao === "DESATUALIZADO"}
            trecho={trechoComTermo(artigo.conteudoTexto, procurado)}
            termo={procurado}
          />
        ))}
      </div>
    </div>
  );
}
