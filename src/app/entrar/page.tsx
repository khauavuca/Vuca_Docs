import type { Metadata } from "next";

import { FormularioDeLogin } from "./FormularioDeLogin";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaDeLogin({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  const { destino } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold tracking-tight text-slate-900">
            Vuca <span className="text-blue-700">Docs</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Base de conhecimento interna. Acesso restrito à equipe.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <FormularioDeLogin destino={destino ?? "/"} />
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Perdeu o acesso? Fale com o administrador da base.
        </p>
      </div>
    </main>
  );
}
