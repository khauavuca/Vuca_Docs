"use client";

import { useTransition } from "react";
import type { SituacaoArtigo } from "@prisma/client";

import { alterarSituacao, excluirArtigo } from "@/actions/artigos";

export function AcoesDoDocumento({
  id,
  situacao,
  podePublicar,
}: {
  id: string;
  situacao: SituacaoArtigo;
  podePublicar: boolean;
}) {
  const [executando, iniciar] = useTransition();

  if (!podePublicar) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {situacao === "PUBLICADO" ? (
        <>
          <button
            type="button"
            disabled={executando}
            onClick={() => iniciar(() => void alterarSituacao(id, "DESATUALIZADO"))}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-60"
          >
            Marcar como desatualizado
          </button>
          <button
            type="button"
            disabled={executando}
            onClick={() => iniciar(() => void alterarSituacao(id, "RASCUNHO"))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Tirar do ar
          </button>
        </>
      ) : null}

      {situacao === "DESATUALIZADO" ? (
        <button
          type="button"
          disabled={executando}
          onClick={() => iniciar(() => void alterarSituacao(id, "PUBLICADO"))}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
        >
          Confirmar que está atualizado
        </button>
      ) : null}

      <button
        type="button"
        disabled={executando}
        onClick={() => {
          const confirmado = window.confirm(
            "Excluir este documento? Esta ação não pode ser desfeita.",
          );
          if (confirmado) iniciar(() => void excluirArtigo(id));
        }}
        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        Excluir
      </button>
    </div>
  );
}
