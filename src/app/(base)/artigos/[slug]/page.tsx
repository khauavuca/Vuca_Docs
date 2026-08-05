import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AlertTriangle, PencilLine, Star, Tag } from "lucide-react";

import { sugerirCorrecao } from "@/actions/artigos";
import { avaliarArtigo } from "@/actions/avaliacoes";
import { alternarFavorito } from "@/actions/leitura";
import { BotaoDeImpressao } from "@/components/BotaoDeImpressao";
import { RegistroDeLeitura } from "@/components/RegistroDeLeitura";
import { obterArtigoPorSlug } from "@/lib/consultas";
import { db } from "@/lib/db";
import { expandirVideos } from "@/lib/renderizar";
import { limparConteudo } from "@/lib/sanitizar";
import { podeEscrever } from "@/lib/sessao";
import { exigirSessao } from "@/lib/sessaoServidor";
import { prepararSumario } from "@/lib/sumario";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sugestao?: string }>;
};

const formatarData = (data: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(data);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artigo = await obterArtigoPorSlug(slug);
  return { title: artigo?.titulo ?? "Documento" };
}

export default async function PaginaDoArtigo({ params, searchParams }: Props) {
  const sessao = await exigirSessao();
  const { slug } = await params;
  const { sugestao } = await searchParams;
  const artigo = await obterArtigoPorSlug(slug);

  if (!artigo) notFound();

  // Rascunho e conteúdo em revisão só aparecem para quem trabalha na base.
  const estaVisivel =
    artigo.situacao === "PUBLICADO" || artigo.situacao === "DESATUALIZADO";
  if (!estaVisivel && !podeEscrever(sessao.papel)) notFound();

  const { html, itens } = prepararSumario(
    expandirVideos(limparConteudo(artigo.conteudoHtml)),
  );

  const [minhaAvaliacao, favorito] = await Promise.all([
    db.avaliacaoDeArtigo.findUnique({
      where: { artigoId_usuarioId: { artigoId: artigo.id, usuarioId: sessao.id } },
    }),
    db.favorito.findUnique({
      where: { artigoId_usuarioId: { artigoId: artigo.id, usuarioId: sessao.id } },
    }),
  ]);

  const areaCompleta = artigo.area?.pai
    ? `${artigo.area.pai.nome} › ${artigo.area.nome}`
    : (artigo.area?.nome ?? "Sem área");

  return (
    <div className="flex gap-8">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <nav aria-label="Trilha" className="text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-700">
              Início
            </Link>
            {artigo.area?.pai ? (
              <>
                <span className="mx-1.5">/</span>
                <Link
                  href={`/areas/${artigo.area.pai.slug}`}
                  className="hover:text-blue-700"
                >
                  {artigo.area.pai.nome}
                </Link>
              </>
            ) : null}
            {artigo.area ? (
              <>
                <span className="mx-1.5">/</span>
                <Link href={`/areas/${artigo.area.slug}`} className="hover:text-blue-700">
                  {artigo.area.nome}
                </Link>
              </>
            ) : null}
          </nav>

          <div className="flex items-center gap-4">
            <form action={alternarFavorito}>
              <input type="hidden" name="artigoId" value={artigo.id} />
              <input type="hidden" name="slug" value={artigo.slug} />
              <button
                type="submit"
                className={`inline-flex items-center gap-1.5 text-sm ${
                  favorito ? "text-amber-600" : "text-slate-600 hover:text-blue-700"
                }`}
              >
                <Star
                  aria-hidden
                  className={`size-3.5 ${favorito ? "fill-amber-400" : ""}`}
                />
                {favorito ? "Nos favoritos" : "Favoritar"}
              </button>
            </form>

            <BotaoDeImpressao />

            {podeEscrever(sessao.papel) ? (
              <Link
                href={`/admin/artigos/${artigo.id}`}
                className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
              >
                <PencilLine aria-hidden className="size-3.5" />
                Editar
              </Link>
            ) : null}
          </div>
        </div>

        {sugestao === "enviada" ? (
          <p
            role="status"
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 print:hidden"
          >
            Sugestão enviada. Ela aparece para quem cuida deste documento.
            Obrigado por ajudar a manter a base correta.
          </p>
        ) : null}

        {artigo.situacao === "DESATUALIZADO" ? (
          <p
            role="status"
            className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden"
          >
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
            Este documento está marcado como desatualizado. Confirme a
            informação antes de usá-la em um atendimento.
          </p>
        ) : null}

        {estaVisivel ? <RegistroDeLeitura artigoId={artigo.id} /> : null}

        <article className="documento">
          {/* Cabeçalho igual em todo documento: muda só o que identifica este. */}
          <header className="documento-cabecalho">
            <p className="documento-kicker">
              {areaCompleta}
              {artigo.tipo ? ` · ${artigo.tipo.nome}` : ""}
            </p>

            <h1 className="documento-titulo">{artigo.titulo}</h1>

            {artigo.resumo ? (
              <p className="documento-resumo">{artigo.resumo}</p>
            ) : null}

            <dl className="documento-metadados">
              <div>
                <dt>Elaborado por</dt>
                <dd>{artigo.autor?.nome ?? "Equipe Vuca"}</dd>
              </div>
              <div>
                <dt>Revisado por</dt>
                <dd>{artigo.revisor?.nome ?? "Pendente"}</dd>
              </div>
              <div>
                <dt>Atualizado em</dt>
                <dd>{formatarData(artigo.atualizadoEm)}</dd>
              </div>
              {artigo.versaoSistema ? (
                <div>
                  <dt>Versão do sistema</dt>
                  <dd>{artigo.versaoSistema}</dd>
                </div>
              ) : null}
            </dl>
          </header>

          <div
            className="conteudo-artigo prose prose-slate max-w-none"
            // O conteúdo é limpo na gravação e outra vez aqui.
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <footer className="documento-rodape">
            <span>Vuca Solution</span>
            <span>vucasolution.com.br</span>
          </footer>
        </article>

        {estaVisivel ? (
          <section className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 print:hidden">
            <p className="text-sm font-medium text-slate-700">
              Este documento resolveu o que você precisava?
            </p>

            <div className="flex gap-2">
              {[
                { valor: "sim", rotulo: "Sim, resolveu" },
                { valor: "nao", rotulo: "Não resolveu" },
              ].map((opcao) => {
                const escolhida =
                  minhaAvaliacao !== null &&
                  minhaAvaliacao.resolveu === (opcao.valor === "sim");

                return (
                  <form key={opcao.valor} action={avaliarArtigo}>
                    <input type="hidden" name="artigoId" value={artigo.id} />
                    <input type="hidden" name="slug" value={artigo.slug} />
                    <input type="hidden" name="resolveu" value={opcao.valor} />
                    <button
                      type="submit"
                      className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                        escolhida
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opcao.rotulo}
                    </button>
                  </form>
                );
              })}
            </div>

            {minhaAvaliacao ? (
              <p className="text-sm text-slate-500">Resposta registrada. Obrigado.</p>
            ) : null}
          </section>
        ) : null}

        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 print:hidden">
          <details>
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Achou algo errado ou faltando neste documento?
            </summary>

            <p className="mt-2 text-sm text-slate-600">
              Escreva o que precisa ser corrigido. A sugestão vai direto para
              quem cuida do documento, e não altera nada no ar.
            </p>

            <form action={sugerirCorrecao} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input type="hidden" name="id" value={artigo.id} />
              <input type="hidden" name="slug" value={artigo.slug} />
              <input
                name="texto"
                required
                minLength={5}
                placeholder="Ex: o caminho do menu mudou na versão nova"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Enviar sugestão
              </button>
            </form>
          </details>
        </section>

        {artigo.marcadores.length > 0 ? (
          <footer className="mt-6 print:hidden">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Tag aria-hidden className="size-3.5" />
              Marcadores
            </p>
            <div className="flex flex-wrap gap-2">
              {artigo.marcadores.map((marcador) => (
                <Link
                  key={marcador.id}
                  href={`/marcadores/${marcador.slug}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-700"
                >
                  {marcador.nome}
                </Link>
              ))}
            </div>
          </footer>
        ) : null}
      </div>

      {itens.length > 1 ? (
        <aside className="hidden w-64 shrink-0 xl:block print:hidden">
          <div className="sticky top-24">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Neste documento
            </p>
            <nav aria-label="Sumário do documento" className="space-y-1.5 border-l border-slate-200">
              {itens.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block border-l-2 border-transparent py-1.5 leading-snug text-slate-600 hover:border-blue-600 hover:text-blue-700 ${
                    item.nivel === 1
                      ? "pl-4 text-base font-medium"
                      : item.nivel === 2
                        ? "pl-6 text-base"
                        : "pl-9 text-sm"
                  }`}
                >
                  {item.texto}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
