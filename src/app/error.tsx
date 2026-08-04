"use client";

import { useEffect } from "react";

/**
 * Última rede de proteção da aplicação. Mostra uma tela compreensível
 * em vez do erro cru do servidor, sem expor detalhe interno a quem lê.
 */
export default function ErroDaAplicacao({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro não tratado:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Alguma coisa saiu do lugar
          </p>
          <p className="mt-1 text-sm text-slate-600">
            A página não pôde ser carregada. Tente de novo. Se continuar
            acontecendo, avise o administrador da base.
          </p>

          {error.digest ? (
            <p className="mt-3 font-mono text-xs text-slate-400">
              Código do erro: {error.digest}
            </p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
