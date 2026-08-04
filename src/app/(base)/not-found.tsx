import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NaoEncontrado() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <FileQuestion aria-hidden className="mx-auto mb-3 size-8 text-slate-400" />
      <p className="font-medium text-slate-900">Não encontramos esta página</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
        O documento pode ter sido despublicado, ou o endereço está incompleto.
        Procure pelo assunto na busca.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
      >
        Voltar para o início
      </Link>
    </div>
  );
}
