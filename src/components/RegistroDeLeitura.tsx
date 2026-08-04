"use client";

import { useEffect, useRef } from "react";

import { registrarLeitura } from "@/actions/leitura";

/**
 * Anota a consulta uma única vez por abertura da página. Fica separado
 * da página porque a montagem da tela só deveria ler dados.
 */
export function RegistroDeLeitura({ artigoId }: { artigoId: string }) {
  const jaAnotado = useRef<string | null>(null);

  useEffect(() => {
    if (!artigoId || jaAnotado.current === artigoId) return;
    jaAnotado.current = artigoId;
    void registrarLeitura(artigoId);
  }, [artigoId]);

  return null;
}
