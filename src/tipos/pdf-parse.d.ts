/**
 * O pacote pdf-parse expõe os tipos apenas na raiz, mas a raiz roda um
 * arquivo de exemplo quando é carregada fora do CommonJS clássico. Por
 * isso importamos o módulo interno, e declaramos o tipo dele aqui.
 */
declare module "pdf-parse/lib/pdf-parse.js" {
  type ResultadoDoPdf = {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
  };

  function pdfParse(dados: Buffer | Uint8Array): Promise<ResultadoDoPdf>;

  export = pdfParse;
}
