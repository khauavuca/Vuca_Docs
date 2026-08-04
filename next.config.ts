import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // A importação de documentos do Word passa por ação de servidor.
    // Atenção: em produção na Vercel o corpo da requisição é limitado a
    // 4,5 MB pela plataforma, independentemente deste valor.
    serverActions: { bodySizeLimit: "15mb" },
  },
  async headers() {
    return [
      {
        source: "/:caminho*",
        headers: [
          // A base é interna: nenhum buscador deve indexar o conteúdo.
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
