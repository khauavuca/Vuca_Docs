"use client";

import { useEffect, useRef } from "react";

import { registrarBuscaSemResultado } from "@/actions/avaliacoes";

/**
 * Anota que a busca não encontrou nada. Fica em um componente próprio
 * porque a página em si apenas lê dados, e gravar durante a montagem da
 * tela geraria registro repetido a cada nova renderização.
 */
export function RegistroDeBuscaVazia({ termo }: { termo: string }) {
  const jaRegistrado = useRef<string | null>(null);

  useEffect(() => {
    if (!termo || jaRegistrado.current === termo) return;
    jaRegistrado.current = termo;
    void registrarBuscaSemResultado(termo);
  }, [termo]);

  return null;
}
