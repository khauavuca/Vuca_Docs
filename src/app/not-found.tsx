import Link from "next/link";

/** Endereço inexistente fora das áreas da base. */
export default function EnderecoNaoEncontrado() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-900">Endereço não encontrado</p>
        <p className="mt-1 text-sm text-slate-600">
          A página que você tentou abrir não existe nesta base.
        </p>

        <Link
          href="/"
          className="mt-5 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
