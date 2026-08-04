import { CascaDaAplicacao, type ItemDeMenu } from "@/components/CascaDaAplicacao";
import { arvoreDeAreas } from "@/lib/consultas";
import { podeAdministrar, podeEscrever } from "@/lib/sessao";
import { exigirSessao } from "@/lib/sessaoServidor";

export default async function LayoutDaBase({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await exigirSessao();
  const areas = await arvoreDeAreas();

  const itens: ItemDeMenu[] = areas.map((area) => ({
    id: area.id,
    nome: area.nome,
    slug: area.slug,
    quantidade: area.quantidade,
    filhas: area.filhasComContagem.map((filha) => ({
      id: filha.id,
      nome: filha.nome,
      slug: filha.slug,
      quantidade: filha.quantidade,
    })),
  }));

  return (
    <CascaDaAplicacao
      sessao={sessao}
      areas={itens}
      podeAdministrarBase={podeAdministrar(sessao.papel)}
      podeEscreverConteudo={podeEscrever(sessao.papel)}
    >
      {children}
    </CascaDaAplicacao>
  );
}
