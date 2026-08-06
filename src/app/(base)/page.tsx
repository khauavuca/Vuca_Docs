import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Plus, Star } from "lucide-react";

import { AvisoDeComentario } from "@/components/AvisoDeComentario";
import { AvisoDeRevisao } from "@/components/AvisoDeRevisao";
import { CartaoDeArtigo } from "@/components/CartaoDeArtigo";
import { CartaoDeComunicado } from "@/components/CartaoDeComunicado";
import { arvoreDeAreas, artigosRecentes } from "@/lib/consultas";
import { db } from "@/lib/db";
import { podeEscrever, podePublicar } from "@/lib/sessao";
import { exigirSessao } from "@/lib/sessaoServidor";

type ArtigoCompacto = {
  slug: string;
  titulo: string;
  area: { nome: string } | null;
};

/**
 * Linha compacta para os blocos pessoais (favoritos, consultados).
 * Um cartão inteiro para um item só faz a seção parecer vazia; uma
 * lista densa se sustenta tanto com um item quanto com dez.
 */
function ListaCompacta({ itens }: { itens: ArtigoCompacto[] }) {
  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {itens.map((artigo) => (
        <Link
          key={artigo.slug}
          href={`/artigos/${artigo.slug}`}
          className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-slate-50"
        >
          <span className="min-w-0 truncate text-slate-800">{artigo.titulo}</span>
          {artigo.area ? (
            <span className="shrink-0 text-xs text-slate-400">{artigo.area.nome}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export default async function PaginaInicial() {
  const sessao = await exigirSessao();
  const [areas, recentes, comunicados, favoritos, ultimasLeituras] = await Promise.all([
    arvoreDeAreas(),
    artigosRecentes(6),
    db.comunicado.findMany({
      orderBy: [{ fixado: "desc" }, { criadoEm: "desc" }],
      include: { autor: { select: { nome: true } } },
      take: 2,
    }),
    db.favorito.findMany({
      where: { usuarioId: sessao.id },
      include: { artigo: { include: { area: true } } },
      orderBy: { criadoEm: "desc" },
      take: 5,
    }),
    db.leituraDeArtigo.findMany({
      where: { usuarioId: sessao.id },
      include: { artigo: { include: { area: true } } },
      orderBy: { ultimaLeitura: "desc" },
      take: 5,
    }),
  ]);

  const baseVazia = areas.length === 0 && recentes.length === 0;
  const temBlocoPessoal = favoritos.length > 0 || ultimasLeituras.length > 0;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Olá, {sessao.nome.split(" ")[0]}
          </h1>
          <p className="mt-1 text-slate-600">
            Procure pelo erro, pelo procedimento ou pela configuração que você
            precisa resolver agora.
          </p>
        </div>

        {podeEscrever(sessao.papel) ? (
          <Link
            href="/admin/artigos/novo"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            <Plus aria-hidden className="size-4" />
            Criar documento
          </Link>
        ) : null}
      </section>

      {podePublicar(sessao.papel) ? <AvisoDeRevisao /> : null}
      <AvisoDeComentario />

      {comunicados.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Comunicados
            </h2>
            <Link href="/comunicados" className="text-sm text-blue-700 hover:underline">
              Ver todos
            </Link>
          </div>

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
        </section>
      ) : null}

      {baseVazia ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <BookOpen aria-hidden className="mx-auto mb-3 size-8 text-slate-400" />
          <p className="font-medium text-slate-900">A base ainda está vazia</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Comece criando as áreas de conhecimento e publicando o primeiro
            documento.
          </p>
          {podeEscrever(sessao.papel) ? (
            <Link
              href="/admin/estrutura"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Criar a primeira área
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          ) : null}
        </section>
      ) : null}

      {temBlocoPessoal ? (
        <section className="grid gap-6 md:grid-cols-2">
          {favoritos.length > 0 ? (
            <div>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Star aria-hidden className="size-3.5 fill-amber-400 text-amber-500" />
                Seus favoritos
              </h2>
              <ListaCompacta
                itens={favoritos.map((f) => ({
                  slug: f.artigo.slug,
                  titulo: f.artigo.titulo,
                  area: f.artigo.area,
                }))}
              />
            </div>
          ) : null}

          {ultimasLeituras.length > 0 ? (
            <div>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Clock aria-hidden className="size-3.5 text-slate-400" />
                Você consultou recentemente
              </h2>
              <ListaCompacta
                itens={ultimasLeituras.map((l) => ({
                  slug: l.artigo.slug,
                  titulo: l.artigo.titulo,
                  area: l.artigo.area,
                }))}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {areas.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Áreas de conhecimento
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {areas.map((area) => (
              <Link
                key={area.id}
                href={`/areas/${area.slug}`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
              >
                <p className="font-medium text-slate-900">{area.nome}</p>
                {area.descricao ? (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                    {area.descricao}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  {area.quantidade === 1
                    ? "1 documento"
                    : `${area.quantidade} documentos`}
                  {area.filhasComContagem.length > 0
                    ? ` · ${area.filhasComContagem.length} subáreas`
                    : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {recentes.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Publicados recentemente
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {recentes.map((artigo) => (
              <CartaoDeArtigo
                key={artigo.id}
                slug={artigo.slug}
                titulo={artigo.titulo}
                resumo={artigo.resumo}
                area={artigo.area}
                tipo={artigo.tipo}
                desatualizado={artigo.situacao === "DESATUALIZADO"}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
