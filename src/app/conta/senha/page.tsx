import Link from "next/link";
import type { Metadata } from "next";

import { FormularioDeTrocaDeSenha } from "./FormularioDeTrocaDeSenha";
import { exigirSessao } from "@/lib/sessaoServidor";

export const metadata: Metadata = { title: "Trocar a senha" };

export default async function PaginaDeTrocaDeSenha() {
  const sessao = await exigirSessao();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold tracking-tight text-slate-900">
            Vuca <span className="text-blue-700">Docs</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {sessao.precisaTrocarSenha
              ? "Sua senha foi definida por outra pessoa. Escolha uma senha que só você conheça."
              : "Trocar a senha da sua conta."}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <FormularioDeTrocaDeSenha />
        </div>

        {sessao.precisaTrocarSenha ? (
          <p className="mt-6 text-center text-xs text-slate-500">
            A base fica disponível assim que você definir a nova senha.
          </p>
        ) : (
          <p className="mt-6 text-center text-sm">
            <Link href="/" className="text-blue-700 hover:underline">
              Voltar para a base
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
