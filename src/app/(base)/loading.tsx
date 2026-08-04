/**
 * Esqueleto exibido enquanto a página busca os dados.
 *
 * O banco fica fora do país e algumas telas fazem várias consultas.
 * Sem isto, a navegação parece travada por segundos.
 */
export default function Carregando() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando o conteúdo</span>

      <div className="h-7 w-64 rounded bg-slate-200" />
      <div className="h-4 w-96 max-w-full rounded bg-slate-100" />

      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, indice) => (
          <div key={indice} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 h-3 w-24 rounded bg-slate-100" />
            <div className="mb-2 h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
