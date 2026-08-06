import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MessageSquareWarning } from "lucide-react";

import { devolverParaAjuste, resolverObservacao } from "@/actions/artigos";
import { AcoesDoDocumento } from "@/components/AcoesDoDocumento";
import { EditorDeArtigo } from "@/components/EditorDeArtigo";
import { listarTipos, opcoesDeArea } from "@/lib/consultas";
import { db } from "@/lib/db";
import { podePublicar } from "@/lib/sessao";
import { exigirQuemEscreve } from "@/lib/sessaoServidor";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Editar documento" };

export default async function PaginaDeEdicao({ params }: Props) {
  const sessao = await exigirQuemEscreve();
  const { id } = await params;

  const artigo = await db.artigo.findUnique({
    where: { id },
    include: {
      marcadores: true,
      versoes: { orderBy: { criadoEm: "desc" }, take: 5 },
      observacoes: {
        orderBy: { criadoEm: "desc" },
        include: { autor: { select: { nome: true } } },
      },
      comentarios: {
        orderBy: { criadoEm: "asc" },
        include: {
          autor: { select: { nome: true } },
          resolvidoPor: { select: { nome: true } },
          respostas: {
            orderBy: { criadoEm: "asc" },
            include: { autor: { select: { nome: true } } },
          },
        },
      },
    },
  });

  if (!artigo) notFound();

  const observacoesAbertas = artigo.observacoes.filter(
    (observacao) => observacao.resolvidaEm === null,
  );

  const [areas, tipos] = await Promise.all([opcoesDeArea(), listarTipos()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="text-sm text-slate-600">
          {artigo.situacao === "PUBLICADO" ? (
            <Link href={`/artigos/${artigo.slug}`} className="text-blue-700 hover:underline">
              Ver como a equipe enxerga
            </Link>
          ) : (
            <span>Este documento ainda não está publicado.</span>
          )}
        </div>

        <AcoesDoDocumento
          id={artigo.id}
          situacao={artigo.situacao}
          podePublicar={podePublicar(sessao.papel)}
        />
      </div>

      {observacoesAbertas.length > 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-900">
            <MessageSquareWarning aria-hidden className="size-4" />
            Ajustes e sugestões em aberto
          </h2>

          <ul className="space-y-2">
            {observacoesAbertas.map((observacao) => (
              <li
                key={observacao.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-slate-800">{observacao.texto}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {observacao.autor?.nome ?? "Revisão"} ·{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(observacao.criadoEm)}
                  </p>
                </div>

                <form action={resolverObservacao}>
                  <input type="hidden" name="id" value={observacao.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Marcar como resolvido
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {artigo.situacao === "EM_REVISAO" && podePublicar(sessao.papel) ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-1 text-sm font-semibold text-slate-800">
            Devolver para ajuste
          </h2>
          <p className="mb-3 text-sm text-slate-600">
            O documento volta para rascunho e a observação fica registrada
            para quem escreveu.
          </p>

          <form action={devolverParaAjuste} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="id" value={artigo.id} />
            <input
              name="texto"
              required
              minLength={5}
              placeholder="O que precisa ser corrigido?"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Devolver
            </button>
          </form>
        </section>
      ) : null}

      <EditorDeArtigo
        artigo={{
          id: artigo.id,
          titulo: artigo.titulo,
          resumo: artigo.resumo ?? "",
          conteudoHtml: artigo.conteudoHtml,
          areaId: artigo.areaId ?? "",
          tipoId: artigo.tipoId ?? "",
          versaoSistema: artigo.versaoSistema ?? "",
          marcadores: artigo.marcadores.map((marcador) => marcador.nome).join(", "),
          imagemDeFundo: artigo.imagemDeFundo ?? "",
        }}
        areas={areas}
        tipos={tipos.map((tipo) => ({ id: tipo.id, nome: tipo.nome }))}
        podePublicar={podePublicar(sessao.papel)}
        comentarios={artigo.comentarios}
      />

      {artigo.versoes.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Últimas publicações
          </h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {artigo.versoes.map((versao) => (
              <li key={versao.id}>
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(versao.criadoEm)}{" "}
                — {versao.titulo}
              </li>
            ))}
          </ul>
          <Link
            href={`/admin/artigos/${artigo.id}/versoes`}
            className="mt-3 inline-block text-sm text-blue-700 hover:underline"
          >
            Ver o histórico e comparar versões
          </Link>
        </section>
      ) : null}
    </div>
  );
}
