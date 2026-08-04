import type { TipoDeAcao } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Registro do que acontece na base.
 *
 * A falha ao registrar nunca pode derrubar a ação em si: é pior perder
 * uma publicação do que perder a linha do histórico. Por isso o erro é
 * contido aqui e apenas anotado no console do servidor.
 */
export async function registrar({
  acao,
  entidade,
  entidadeId,
  descricao,
  autorId,
}: {
  acao: TipoDeAcao;
  entidade: "artigo" | "area" | "tipo" | "usuario";
  entidadeId?: string | null;
  descricao: string;
  autorId?: string | null;
}): Promise<void> {
  try {
    await db.registroDeAuditoria.create({
      data: {
        acao,
        entidade,
        entidadeId: entidadeId ?? null,
        descricao: descricao.slice(0, 500),
        autorId: autorId ?? null,
      },
    });
  } catch (erro) {
    console.error("Falha ao gravar o registro de auditoria:", erro);
  }
}
