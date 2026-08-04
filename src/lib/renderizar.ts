import { enderecoDeVideoDoDrive } from "@/lib/sanitizar";

/**
 * O conteúdo é gravado apenas com <div data-video-url="…">. Na hora de
 * exibir, essa marcação vira o quadro do vídeo. O endereço é conferido
 * de novo aqui: só o Google Drive é aceito.
 */
export function expandirVideos(html: string): string {
  return html.replace(
    /<div([^>]*?)data-video-url="([^"]+)"([^>]*?)>\s*<\/div>/gi,
    (correspondencia, _antes, url: string) => {
      const endereco = enderecoDeVideoDoDrive(url);
      if (!endereco) return "";

      return `<div class="video-do-drive my-6"><iframe src="${endereco}" allow="autoplay; fullscreen" allowfullscreen class="aspect-video w-full rounded-lg border border-slate-200"></iframe></div>`;
    },
  );
}
