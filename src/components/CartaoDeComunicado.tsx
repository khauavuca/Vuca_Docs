import { Megaphone, Pin } from "lucide-react";

/**
 * O corpo do comunicado é texto puro. Cada linha vira um parágrafo, e o
 * React escapa o conteúdo sozinho, então não há HTML vindo de fora.
 */
export function CartaoDeComunicado({
  titulo,
  corpo,
  autor,
  criadoEm,
  fixado,
}: {
  titulo: string;
  corpo: string;
  autor?: string | null;
  criadoEm: Date;
  fixado?: boolean;
}) {
  const linhas = corpo.split(/\r?\n/).filter((linha) => linha.trim());

  return (
    <article
      className={`rounded-xl border p-4 ${
        fixado ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-1 flex items-center gap-2">
        {fixado ? (
          <Pin aria-hidden className="size-4 text-blue-700" />
        ) : (
          <Megaphone aria-hidden className="size-4 text-slate-400" />
        )}
        <h3 className="font-medium text-slate-900">{titulo}</h3>
      </div>

      <div className="space-y-1.5 text-sm text-slate-700">
        {linhas.map((linha, indice) => (
          <p key={indice}>{linha}</p>
        ))}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {autor ?? "Equipe Vuca"} ·{" "}
        {new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(criadoEm)}
      </p>
    </article>
  );
}
