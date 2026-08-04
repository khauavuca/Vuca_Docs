import { NextResponse } from "next/server";

import { baixarArquivo } from "@/lib/armazenamento";
import { db } from "@/lib/db";
import { obterSessao } from "@/lib/sessaoServidor";

export const runtime = "nodejs";

/**
 * Única porta de saída dos arquivos. O balde é privado, então nenhuma
 * imagem da base pode ser aberta por quem não tem sessão.
 */
export async function GET(
  _requisicao: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessao = await obterSessao();
  if (!sessao) {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 401 });
  }

  const { id } = await params;
  const anexo = await db.anexo.findUnique({ where: { id } });

  if (!anexo) {
    return NextResponse.json({ erro: "Arquivo não encontrado." }, { status: 404 });
  }

  try {
    const conteudo = await baixarArquivo(anexo.chave);

    return new NextResponse(conteudo, {
      headers: {
        "Content-Type": anexo.tipoMime,
        "Content-Disposition": `inline; filename="${encodeURIComponent(anexo.nomeOriginal)}"`,
        // Guarda no navegador de quem já entrou, nunca em cache compartilhado.
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ erro: "Arquivo indisponível." }, { status: 404 });
  }
}
