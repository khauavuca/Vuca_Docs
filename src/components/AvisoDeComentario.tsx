import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { db } from "@/lib/db";

/**
 * Aviso de comentário em aberto em algum documento — mesma ideia do
 * AvisoDeRevisao: aparece assim que a pessoa entra, sem precisar abrir
 * cada documento pra descobrir que tem conversa pendente.
 */
export async function AvisoDeComentario() {
  const abertos = await db.comentarioDeArtigo.findMany({
    where: { resolvido: false },
    select: { id: true, trecho: true, artigo: { select: { id: true, titulo: true } } },
    orderBy: { criadoEm: "asc" },
    take: 5,
  });

  if (abertos.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-900">
        <MessageSquare aria-hidden className="size-4" />
        {abertos.length === 1
          ? "1 comentário em aberto"
          : `${abertos.length} comentários em aberto`}
      </p>
      <ul className="space-y-1">
        {abertos.map((comentario) => (
          <li key={comentario.id} className="text-sm">
            <Link
              href={`/admin/artigos/${comentario.artigo.id}`}
              className="text-amber-800 hover:underline"
            >
              {comentario.artigo.titulo}
            </Link>
            <span className="ml-1.5 text-xs text-amber-600">
              — "{comentario.trecho.slice(0, 40)}"
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
