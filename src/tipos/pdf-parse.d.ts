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

  /** Item de texto de uma página, no formato que o pdf.js expõe internamente. */
  type ItemDeTextoDoPdf = {
    str: string;
    transform: number[];
  };

  type PaginaDoPdf = {
    getTextContent(): Promise<{ items: ItemDeTextoDoPdf[] }>;
  };

  type OpcoesDoPdfParse = {
    /**
     * Substitui a extração padrão de texto de uma página. Usado para
     * reconstruir a ordem de leitura a partir da posição de cada item,
     * em vez da ordem em que foram desenhados no arquivo.
     */
    pagerender?: (pagina: PaginaDoPdf) => Promise<string>;
  };

  function pdfParse(
    dados: Buffer | Uint8Array,
    opcoes?: OpcoesDoPdfParse,
  ): Promise<ResultadoDoPdf>;

  export = pdfParse;
}
