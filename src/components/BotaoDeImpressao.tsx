"use client";

import { Printer } from "lucide-react";

/**
 * A exportação em PDF usa a impressão do próprio navegador, com as
 * folhas que já estão na tela. É o mesmo padrão em qualquer documento,
 * e não exige gerar o arquivo no servidor.
 */
export function BotaoDeImpressao() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-700"
    >
      <Printer aria-hidden className="size-3.5" />
      Baixar em PDF
    </button>
  );
}
