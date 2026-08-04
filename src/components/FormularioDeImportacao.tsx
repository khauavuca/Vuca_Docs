"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Upload } from "lucide-react";

import { importarDocumento, type EstadoDaImportacao } from "@/actions/importar";
import type { OpcaoDeArea, OpcaoDeTipo } from "@/components/EditorDeArtigo";

const CAMPO =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

function Botao() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
    >
      <Upload aria-hidden className="size-4" />
      {pending ? "Convertendo o documento…" : "Importar"}
    </button>
  );
}

export function FormularioDeImportacao({
  areas,
  tipos,
}: {
  areas: OpcaoDeArea[];
  tipos: OpcaoDeTipo[];
}) {
  const [estado, acao] = useActionState<EstadoDaImportacao, FormData>(
    importarDocumento,
    {},
  );

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="arquivo" className="mb-1.5 block text-sm font-medium text-slate-700">
          Arquivo do documento
        </label>
        <input
          id="arquivo"
          name="arquivo"
          type="file"
          accept=".docx,.pdf"
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:text-slate-700"
        />
        <p className="mt-1 text-xs text-slate-500">
          Word (.docx) ou PDF, até 15 MB. As figuras vêm junto nos dois casos.
          Quando existir o Word original, prefira ele: a estrutura vem melhor.
        </p>
      </div>

      <div>
        <label htmlFor="areaId" className="mb-1.5 block text-sm font-medium text-slate-700">
          Área
        </label>
        <select id="areaId" name="areaId" defaultValue="" className={CAMPO}>
          <option value="">Definir depois</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nivel > 0 ? `— ${area.nome}` : area.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tipoId" className="mb-1.5 block text-sm font-medium text-slate-700">
          Tipo de documento
        </label>
        <select id="tipoId" name="tipoId" defaultValue="" className={CAMPO}>
          <option value="">Definir depois</option>
          {tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nome}
            </option>
          ))}
        </select>
      </div>

      {estado.erro ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
          {estado.erro}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Botao />
      </div>
    </form>
  );
}
