import { NextResponse } from "next/server";

import {
  TAMANHO_MAXIMO_DE_VIDEO,
  TIPOS_DE_VIDEO_ACEITOS,
  prepararEnvioDeVideo,
} from "@/lib/anexos";
import { podeEscrever } from "@/lib/sessao";
import { obterSessao } from "@/lib/sessaoServidor";

export const runtime = "nodejs";

/**
 * Não recebe o vídeo em si — só prepara o registro do anexo e devolve um
 * endereço assinado de uso único, pro navegador enviar o arquivo direto
 * pro armazenamento. Um vídeo de alguns minutos facilmente estoura o
 * limite de resposta de uma função da Vercel, então os bytes nunca
 * passam por aqui.
 */
export async function POST(requisicao: Request) {
  const sessao = await obterSessao();

  if (!sessao || !podeEscrever(sessao.papel)) {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  }

  const corpo = await requisicao.json().catch(() => null);
  const nomeOriginal = String(corpo?.nomeOriginal ?? "").trim();
  const tipoMime = String(corpo?.tipoMime ?? "");
  const tamanho = Number(corpo?.tamanho ?? 0);

  if (!TIPOS_DE_VIDEO_ACEITOS.has(tipoMime)) {
    return NextResponse.json(
      { erro: "Formato não aceito. Envie um vídeo MP4, WEBM ou MOV." },
      { status: 415 },
    );
  }

  if (!Number.isFinite(tamanho) || tamanho <= 0 || tamanho > TAMANHO_MAXIMO_DE_VIDEO) {
    return NextResponse.json(
      { erro: "Vídeo grande demais. O limite é de 250 MB, algo em torno de 5 minutos." },
      { status: 413 },
    );
  }

  try {
    const anexo = await prepararEnvioDeVideo({
      nomeOriginal,
      tipoMime,
      tamanho,
      enviadoPorId: sessao.id,
    });

    return NextResponse.json(anexo);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Falha ao preparar o envio.";
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
