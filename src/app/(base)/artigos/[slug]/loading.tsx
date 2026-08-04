/** Esqueleto no formato de folha, para a troca de tela não dar solavanco. */
export default function CarregandoDocumento() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando o documento</span>

      <div className="mb-4 h-4 w-48 rounded bg-slate-100" />

      <div className="mx-auto w-full max-w-[52rem] rounded-lg border border-slate-200 bg-white px-8 py-10 sm:px-14 sm:py-12">
        <div className="h-6 w-40 rounded bg-slate-200" />

        <div className="my-16 space-y-4">
          <div className="h-3 w-32 rounded bg-slate-100" />
          <div className="h-10 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-1/2 rounded bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, indice) => (
            <div key={indice}>
              <div className="mb-1 h-2.5 w-20 rounded bg-slate-100" />
              <div className="h-3.5 w-28 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
