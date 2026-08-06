import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase do lado do navegador — usado só para enviar vídeo
 * direto pro balde de anexos com um token de uso único, sem passar pela
 * nossa função (que não aguentaria o tamanho de um vídeo de verdade).
 *
 * Só existe pra essa finalidade: nenhuma outra parte do site fala com o
 * Supabase pelo navegador. A chave usada aqui é a publicável (anon),
 * feita pra ser exposta — sozinha, sem um token assinado pelo servidor
 * pra um arquivo específico, ela não lê nem escreve nada no balde
 * privado.
 */

let clienteEmCache: SupabaseClient | null = null;

export const BALDE_DE_ANEXOS = "anexos";

export function clienteDeArmazenamento(): SupabaseClient {
  if (clienteEmCache) return clienteEmCache;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    throw new Error(
      "Envio de vídeo não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  clienteEmCache = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return clienteEmCache;
}
