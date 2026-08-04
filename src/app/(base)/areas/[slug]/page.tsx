import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CartaoDeArtigo } from "@/components/CartaoDeArtigo";
import { listarArtigosDaArea, obterAreaPorSlug } from "@/lib/consultas";
import { exigirSessao } from "@/lib/sessaoServidor";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = await obterAreaPorSlug(slug);
  return { title: area?.nome ?? "Área" };
}

export default async function PaginaDaArea({ params }: Props) {
  await exigirSessao();

  const { slug } = await params;
  const area = await obterAreaPorSlug(slug);
  if (!area || area.arquivada) notFound();

  const artigos = await listarArtigosDaArea(
    area.id,
    area.filhas.map((filha) => filha.id),
  );

  return (
    <div className="space-y-6">
      <header>
        {area.pai ? (
          <nav aria-label="Trilha" className="mb-1 text-sm text-slate-500">
            <Link href={`/areas/${area.pai.slug}`} className="hover:text-blue-700">
              {area.pai.nome}
            </Link>
            <span className="mx-1.5">/</span>
            <span>{area.nome}</span>
          </nav>
        ) : null}

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {area.nome}
        </h1>
        {area.descricao ? (
          <p className="mt-1 text-slate-600">{area.descricao}</p>
        ) : null}
      </header>

      {area.filhas.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Subáreas
          </h2>
          <div className="flex flex-wrap gap-2">
            {area.filhas.map((filha) => (
              <Link
                key={filha.id}
                href={`/areas/${filha.slug}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-blue-300 hover:text-blue-700"
              >
                {filha.nome}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        {artigos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            Nenhum documento publicado nesta área ainda.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {artigos.map((artigo) => (
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
        )}
      </section>
    </div>
  );
}
