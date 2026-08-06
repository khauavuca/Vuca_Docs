import { NextResponse } from "next/server";

import { baixarArquivo, criarUrlDeLeitura } from "@/lib/armazenamento";
import { db } from "@/lib/db";
import { obterSessao } from "@/lib/sessaoServidor";

export const runtime = "nodejs";

/**
 * Única porta de saída dos arquivos. O balde é privado, então nenhum
 * anexo da base pode ser aberto por quem não tem sessão.
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

  // Vídeo é grande demais pra passar pela nossa função — manda direto pro
  // armazenamento com um endereço assinado, de validade curta. Isso
  // também dá suporte a pedido por trecho, que o navegador usa pra
  // avançar o vídeo sem baixar tudo de novo.
  if (anexo.tipoMime.startsWith("video/")) {
    try {
      const url = await criarUrlDeLeitura(anexo.chave, 4 * 60 * 60);
      return NextResponse.redirect(url);
    } catch {
      return NextResponse.json({ erro: "Vídeo indisponível." }, { status: 404 });
    }
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
