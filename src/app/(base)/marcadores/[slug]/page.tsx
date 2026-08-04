import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CartaoDeArtigo } from "@/components/CartaoDeArtigo";
import { db } from "@/lib/db";
import { listarArtigosPorMarcador } from "@/lib/consultas";
import { exigirSessao } from "@/lib/sessaoServidor";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const marcador = await db.marcador.findUnique({ where: { slug } });
  return { title: marcador ? `Marcador: ${marcador.nome}` : "Marcador" };
}

export default async function PaginaDoMarcador({ params }: Props) {
  await exigirSessao();

  const { slug } = await params;
  const marcador = await db.marcador.findUnique({ where: { slug } });
  if (!marcador) notFound();

  const artigos = await listarArtigosPorMarcador(slug);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Marcador</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {marcador.nome}
        </h1>
      </header>

      {artigos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
          Nenhum documento publicado com este marcador.
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
    </div>
  );
}
