import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Minus, Plus } from "lucide-react";

import { restaurarVersao } from "@/actions/artigos";
import { compararBlocos, contarMudancas, extrairBlocos } from "@/lib/comparar";
import { db } from "@/lib/db";
import { podePublicar } from "@/lib/sessao";
import { exigirQuemEscreve } from "@/lib/sessaoServidor";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ de?: string; para?: string }>;
};

export const metadata: Metadata = { title: "Histórico do documento" };

const ATUAL = "atual";

const formatar = (data: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    data,
  );

export default async function PaginaDeVersoes({ params, searchParams }: Props) {
  const sessao = await exigirQuemEscreve();
  const { id } = await params;
  const { de, para } = await searchParams;

  const artigo = await db.artigo.findUnique({
    where: { id },
    include: {
      versoes: {
        orderBy: { criadoEm: "desc" },
        include: { autor: { select: { nome: true } } },
      },
    },
  });

  if (!artigo) notFound();

  const opcoes = [
    { valor: ATUAL, rotulo: "Conteúdo atual, ainda não publicado" },
    ...artigo.versoes.map((versao) => ({
      valor: versao.id,
      rotulo: `${formatar(versao.criadoEm)} — ${versao.autor?.nome ?? "sistema"}`,
    })),
  ];

  // Por padrão compara a penúltima publicação com a última.
  const escolhaDe = de ?? artigo.versoes[1]?.id ?? artigo.versoes[0]?.id ?? ATUAL;
  const escolhaPara = para ?? (artigo.versoes[1] ? artigo.versoes[0].id : ATUAL);

  const conteudoDe =
    escolhaDe === ATUAL
      ? artigo.conteudoHtml
      : (artigo.versoes.find((versao) => versao.id === escolhaDe)?.conteudoHtml ?? "");

  const conteudoPara =
    escolhaPara === ATUAL
      ? artigo.conteudoHtml
      : (artigo.versoes.find((versao) => versao.id === escolhaPara)?.conteudoHtml ?? "");

  const linhas = compararBlocos(extrairBlocos(conteudoDe), extrairBlocos(conteudoPara));
  const { adicionados, removidos } = contarMudancas(linhas);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-medium text-slate-900">{artigo.titulo}</h2>
          <p className="text-sm text-slate-600">
            {artigo.versoes.length === 0
              ? "Este documento ainda não foi publicado nenhuma vez."
              : `${artigo.versoes.length} ${
                  artigo.versoes.length === 1 ? "publicação registrada" : "publicações registradas"
                }`}
          </p>
        </div>

        <Link
          href={`/admin/artigos/${artigo.id}`}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Voltar para a edição
        </Link>
      </header>

      {artigo.versoes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
          O histórico começa na primeira publicação.
        </p>
      ) : (
        <>
          <form
            method="get"
            className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div>
              <label htmlFor="de" className="mb-1.5 block text-xs font-medium text-slate-600">
                Versão anterior
              </label>
              <select
                id="de"
                name="de"
                defaultValue={escolhaDe}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {opcoes.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="para" className="mb-1.5 block text-xs font-medium text-slate-600">
                Comparar com
              </label>
              <select
                id="para"
                name="para"
                defaultValue={escolhaPara}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {opcoes.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Comparar
            </button>

            <p className="ml-auto text-sm text-slate-600">
              <span className="text-emerald-700">{adicionados} incluídos</span>
              <span className="mx-2 text-slate-300">·</span>
              <span className="text-red-700">{removidos} retirados</span>
            </p>
          </form>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {linhas.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-600">
                As duas versões estão vazias.
              </p>
            ) : adicionados === 0 && removidos === 0 ? (
              <p className="p-6 text-center text-sm text-slate-600">
                Nenhuma diferença de conteúdo entre as duas versões.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {linhas.map((linha, indice) => (
                  <li
                    key={indice}
                    className={`flex gap-2 px-4 py-2 ${
                      linha.tipo === "adicionado"
                        ? "bg-emerald-50 text-emerald-900"
                        : linha.tipo === "removido"
                          ? "bg-red-50 text-red-900"
                          : "text-slate-600"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0" aria-hidden>
                      {linha.tipo === "adicionado" ? (
                        <Plus className="size-3.5" />
                      ) : linha.tipo === "removido" ? (
                        <Minus className="size-3.5" />
                      ) : (
                        <span className="inline-block size-3.5" />
                      )}
                    </span>
                    <span>
                      <span className="sr-only">
                        {linha.tipo === "adicionado"
                          ? "Trecho incluído: "
                          : linha.tipo === "removido"
                            ? "Trecho retirado: "
                            : ""}
                      </span>
                      {linha.texto}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
              Publicações
            </h3>
            <ul className="divide-y divide-slate-100">
              {artigo.versoes.map((versao) => (
                <li
                  key={versao.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="text-slate-800">{versao.titulo}</p>
                    <p className="text-xs text-slate-500">
                      {formatar(versao.criadoEm)} · {versao.autor?.nome ?? "sistema"}
                      {versao.comentario ? ` · ${versao.comentario}` : ""}
                    </p>
                  </div>

                  {podePublicar(sessao.papel) ? (
                    <form action={restaurarVersao}>
                      <input type="hidden" name="versaoId" value={versao.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        Restaurar esta versão
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
