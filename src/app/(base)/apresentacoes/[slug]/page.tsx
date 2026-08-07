import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { X } from "lucide-react";

import { obterApresentacaoPorSlug } from "@/lib/consultas";
import { exigirSessao } from "@/lib/sessaoServidor";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apresentacao = await obterApresentacaoPorSlug(slug);
  return { title: apresentacao?.titulo ?? "Apresentação" };
}

/**
 * Toma a tela inteira por cima do resto da aplicação — o deck já é
 * desenhado pra viewport cheio, e um iframe isolado é o jeito mais
 * simples de servir HTML de fora sem misturar com o resto do site.
 */
export default async function PaginaDeApresentacao({ params }: Props) {
  await exigirSessao();
  const { slug } = await params;
  const apresentacao = await obterApresentacaoPorSlug(slug);

  if (!apresentacao) notFound();

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <Link
        href="/apresentacoes"
        aria-label="Voltar para as apresentações"
        className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
      >
        <X aria-hidden className="size-5" />
      </Link>

      <iframe
        src={`/api/anexos/${apresentacao.anexoId}`}
        title={apresentacao.titulo}
        sandbox="allow-same-origin"
        className="size-full border-0"
      />
    </div>
  );
}
