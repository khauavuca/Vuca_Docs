import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Imagens e anexos ficam em balde privado. Nenhum endereço público é
 * gerado: o arquivo só sai daqui pela rota /api/anexos, que confere a
 * sessão antes de entregar o conteúdo.
 */

let clienteEmCache: SupabaseClient | null = null;

export function balde(): string {
  return process.env.SUPABASE_BUCKET ?? "anexos";
}

function cliente(): SupabaseClient {
  if (clienteEmCache) return clienteEmCache;

  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    throw new Error(
      "Armazenamento não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  clienteEmCache = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return clienteEmCache;
}

export async function enviarArquivo(
  chave: string,
  conteudo: ArrayBuffer,
  tipoMime: string,
): Promise<void> {
  const { error } = await cliente()
    .storage.from(balde())
    .upload(chave, conteudo, { contentType: tipoMime, upsert: false });

  if (error) throw new Error(`Falha ao enviar o arquivo: ${error.message}`);
}

export async function baixarArquivo(chave: string): Promise<Blob> {
  const { data, error } = await cliente().storage.from(balde()).download(chave);

  if (error || !data) {
    throw new Error(`Falha ao ler o arquivo: ${error?.message ?? "não encontrado"}`);
  }

  return data;
}

export async function removerArquivo(chave: string): Promise<void> {
  await cliente().storage.from(balde()).remove([chave]);
}
