"use client";

export default function ErroDaAdministracao({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <p className="font-medium text-red-900">Não foi possível concluir a ação</p>
      <p className="mt-1 text-sm text-red-800">
        {error.message || "Tente novamente em instantes."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm text-red-800 hover:bg-red-100"
      >
        Tentar de novo
      </button>
    </div>
  );
}
