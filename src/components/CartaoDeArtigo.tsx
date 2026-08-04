import Link from "next/link";

import { partirPorTermo } from "@/lib/texto";

type Props = {
  slug: string;
  titulo: string;
  resumo?: string | null;
  trecho?: string | null;
  area?: { nome: string } | null;
  tipo?: { nome: string } | null;
  desatualizado?: boolean;
  /** Quando informado, destaca as palavras procuradas no texto. */
  termo?: string;
};

function Destacado({ texto, termo }: { texto: string; termo?: string }) {
  if (!termo) return <>{texto}</>;

  return (
    <>
      {partirPorTermo(texto, termo).map((pedaco, indice) =>
        pedaco.destacado ? (
          <mark key={indice} className="rounded bg-amber-100 px-0.5 text-slate-900">
            {pedaco.texto}
          </mark>
        ) : (
          <span key={indice}>{pedaco.texto}</span>
        ),
      )}
    </>
  );
}

export function CartaoDeArtigo({
  slug,
  titulo,
  resumo,
  trecho,
  area,
  tipo,
  desatualizado,
  termo,
}: Props) {
  return (
    <Link
      href={`/artigos/${slug}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
        {area ? <span className="text-slate-500">{area.nome}</span> : null}
        {tipo ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
            {tipo.nome}
          </span>
        ) : null}
        {desatualizado ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
            Precisa de revisão
          </span>
        ) : null}
      </div>

      <p className="font-medium text-slate-900">
        <Destacado texto={titulo} termo={termo} />
      </p>

      {trecho ?? resumo ? (
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
          <Destacado texto={trecho ?? resumo ?? ""} termo={termo} />
        </p>
      ) : null}
    </Link>
  );
}
