# Vuca Docs — Documento de Escopo

**Versão:** 0.1 (rascunho para validação)
**Data:** 03/08/2026
**Responsável pelo conteúdo:** Analista de QA
**Aprovação editorial:** gestor da área

---

## 1. Contexto e problema

O conhecimento sobre o sistema Vuca e suas configurações está espalhado e depende de pessoas específicas. Hoje:

- A documentação existente está em arquivos Word, sem local único de consulta.
- Suporte, implantação e CX não têm uma fonte confiável para consultar procedimentos.
- Não há comunicação estruturada do que muda no sistema.
- O conhecimento fica retido em quem já viveu o problema antes.

O custo disso aparece em retrabalho, atendimento inconsistente, demora na integração de novos funcionários e dependência de poucas pessoas.

## 2. Objetivo

Criar uma base de conhecimento interna, centralizada e pesquisável, que sirva como fonte única de verdade sobre o sistema Vuca, suas configurações e seus procedimentos operacionais.

### Resultados esperados

| Resultado | Como medir |
|---|---|
| Reduzir perguntas repetidas nos canais internos | Contagem de dúvidas recorrentes antes e depois |
| Acelerar a integração de novos funcionários | Tempo até o primeiro atendimento autônomo |
| Padronizar o atendimento | Procedimentos com passo a passo único e versionado |
| Preservar o conhecimento | Acervo publicado e revisado, independente de pessoas |

## 3. Público

Uso exclusivamente interno. Nenhum conteúdo é aberto ao público ou a clientes.

| Perfil | Uso principal |
|---|---|
| Suporte | Consulta rápida durante o atendimento: erros, configurações, procedimentos |
| Implantação | Roteiros de instalação, configuração de unidade, checklists |
| CX | Respostas padronizadas e explicações funcionais |
| Desenvolvimento e QA | Referência técnica e comportamento esperado do sistema |
| Gestão | Acompanhamento do que está documentado e do que falta |

### Papéis no sistema

| Papel | Permissões |
|---|---|
| Leitor | Lê o conteúdo publicado e usa a busca |
| Colaborador | Sugere um artigo novo ou uma correção, que entra na fila de revisão |
| Autor | Cria e edita rascunhos, envia para revisão |
| Revisor | Aprova, devolve ou publica o conteúdo |
| Administrador | Cria contas, define papéis e gerencia as categorias |

A autoria oficial fica com o Analista de QA e a aprovação com o gestor. Qualquer pessoa da equipe pode contribuir como colaborador, mas nada chega ao ar sem passar pela revisão. Assim o conhecimento de quem está na linha de frente entra na base sem abrir mão do controle de qualidade.

## 4. Arquitetura da informação

A organização combina três eixos. Isso evita o erro clássico de forçar uma única árvore de categorias que envelhece rápido.

### Eixo 1 — Área de conhecimento (navegação principal)

A trilha que a pessoa percorre no menu lateral.

**Requisito central: a estrutura é configurável pela própria plataforma.** Nenhuma área fica fixa no programa. O administrador cria, renomeia, reordena e arquiva áreas quando quiser, sem depender de alteração no sistema. A documentação vai crescer conforme os assuntos aparecem, e hoje é impossível prever a lista final.

A estrutura aceita dois níveis, o que já cobre os casos reais:

```
Integrações
├── Valori
└── Accon
Equipamentos
└── Balança
```

Regras:

- Criar, renomear, reordenar e arquivar áreas é feito pela interface.
- Arquivar uma área não apaga os artigos. Eles precisam ser movidos antes.
- Renomear uma área não quebra os endereços já compartilhados internamente.
- As áreas iniciais serão criadas junto com a migração dos primeiros documentos. Não existe lista definitiva neste escopo, por decisão.

Os tipos de documento e os marcadores seguem a mesma regra: também são gerenciáveis pela interface.

### Eixo 2 — Tipo de documento (define o formato do texto)

Cada tipo tem um modelo próprio de escrita, o que garante consistência:

| Tipo | Para que serve |
|---|---|
| Guia passo a passo | Ensina a executar uma tarefa do início ao fim |
| Procedimento operacional | Define como a equipe deve agir em uma situação padrão |
| Referência de configuração | Descreve parâmetros, campos e valores possíveis |
| Solução de problema | Parte do sintoma ou da mensagem de erro e chega à correção |
| Perguntas frequentes | Respostas curtas para dúvidas recorrentes |
| Treinamento | Conteúdo didático, geralmente com vídeo |
| Glossário | Termos e siglas usados na empresa e no sistema |

### Eixo 3 — Marcadores livres (busca e relação)

Marcadores transversais que cruzam as áreas: `impressora`, `sincronização`, `unidade`, `instalação`, `erro`, `banco de dados`, entre outros. Servem para encontrar conteúdo que não cabe em uma única categoria.

### Metadados obrigatórios de cada documento

- Título e resumo de uma linha
- Área, tipo e marcadores
- Autor e revisor
- Data da última revisão
- Situação: rascunho, em revisão, publicado ou desatualizado
- Versão do sistema a que se aplica, quando fizer sentido

## 5. Funcionalidades

### Fase 1 — Base utilizável

O que precisa existir para a plataforma substituir os arquivos em Word.

1. **Acesso restrito.** Login obrigatório em toda a aplicação, inclusive na página inicial. Nenhuma página acessível sem sessão válida.
2. **Leitura do conteúdo.** Página de artigo com sumário lateral, trilha de navegação e tempo estimado de leitura.
3. **Navegação por área e tipo.** Menu lateral com a árvore de áreas e filtros por tipo e marcador.
4. **Gestão da estrutura de conhecimento.** Tela em que o administrador cria, renomeia, reordena e arquiva áreas, tipos e marcadores, sem depender de alteração no programa.
5. **Busca no conteúdo.** Busca que encontra trechos dentro dos artigos, não apenas títulos, com destaque do termo encontrado.
6. **Editor de conteúdo no navegador.** Texto formatado, títulos, listas, tabelas, blocos de código, avisos de atenção e inserção de imagens.
7. **Imagens e anexos.** Envio de prints e arquivos, com armazenamento fora da aplicação.
8. **Vídeo incorporado.** O vídeo fica no Google Drive e é exibido dentro do artigo a partir do link.
9. **Fluxo de revisão.** Rascunho → em revisão → publicado, com devolução comentada pelo revisor.
10. **Histórico de versões.** Registro de quem alterou o quê, com comparação entre versões e restauração.
11. **Gestão de usuários.** Tela em que o administrador cria a conta, define o papel e desativa o acesso. Não existe cadastro aberto: ninguém entra sem ser criado por dentro.
12. **Contribuição da equipe.** Qualquer pessoa pode sugerir um artigo ou apontar uma correção. A sugestão vira rascunho e entra na mesma fila de revisão.

### Fase 2 — Qualidade e circulação do conhecimento

13. Sinalização de conteúdo desatualizado e lembrete de revisão periódica.
14. Avaliação do artigo pelo leitor ("isto resolveu seu problema?") e comentários internos.
15. Novidades e comunicados, para resolver a falha de comunicação interna.
16. Painel de saúde do acervo: artigos mais lidos, buscas sem resultado, documentos vencidos.
17. Favoritos e histórico de leitura pessoal.

### Fase 3 — Alcance

18. Base preparada para consulta assistida por IA, aproveitando a estrutura de metadados já definida.
19. Exportação de artigo ou trilha em PDF.

**Descartado:** integração com as telas dos sistemas Vuca. A plataforma é
um repositório de documentos. Quem tem dúvida entra, encontra a área e
lê. Ligar a base a telas de sistema é outro produto.

## 6. Migração do acervo em Word

**Decisão revista em 04/08/2026.** A estimativa inicial de quatro documentos ficou defasada assim que o acervo real apareceu. O importador foi construído.

A importação aceita arquivos **.docx** e funciona assim:

- Títulos, listas, tabelas e formatação de texto são convertidos.
- As figuras do documento viram anexos da plataforma, protegidos por login.
- Os títulos do Word descem um nível, porque o título do artigo ocupa o primeiro nível na web. Isso faz o sumário lateral funcionar.
- O documento entra sempre como rascunho. Importar não publica nada.

O que a conversão não traz, por natureza do formato:

- Capa, cabeçalho, rodapé e numeração de página, que não existem na web.
- Caixas de texto, formas e imagens agrupadas do Word.

**PDF também é importado.** O formato guarda posição de letras na página, não estrutura de documento. Por isso a estrutura é deduzida da forma como o texto foi escrito: seções numeradas e linhas em caixa alta viram títulos, marcadores viram listas. As figuras são extraídas do arquivo e entregues em uma seção no fim do documento, para serem posicionadas, já que o PDF não guarda a ligação entre imagem e parágrafo. Quando existir o Word de origem, ele continua sendo a melhor escolha.

**Ponto de atenção que continua valendo:** documentos em Word costumam reunir assuntos diferentes no mesmo arquivo. Provavelmente cada arquivo vai virar mais de um artigo, e essa divisão é trabalho editorial humano.

## 7. Requisitos não funcionais

### Segurança e acesso

Este é o ponto mais sensível do projeto. O conteúdo descreve configurações internas do sistema.

- Autenticação obrigatória em toda a aplicação. Como a plataforma fica publicada na internet, o isolamento depende inteiramente do login.
- Login por nome de usuário e senha, com as contas criadas apenas pelo administrador. Não existe tela de cadastro.
- Senhas guardadas com algoritmo próprio de derivação, jamais em texto legível.
- Bloqueio temporário após tentativas seguidas de acesso malsucedido.
- Bloqueio de indexação por buscadores.
- Imagens e anexos protegidos por acesso autenticado. Um endereço de arquivo não pode funcionar para quem não tem sessão.
- Registro de auditoria das ações de publicação, edição e exclusão.
- Encerramento de sessão por inatividade.
- Desativação imediata do acesso no desligamento de funcionários, feita pelo administrador.

**Risco assumido — vídeos no Google Drive.** O vídeo fica fora da plataforma e o controle de quem assiste passa a ser do Drive. Se o compartilhamento for "qualquer pessoa com o link", quem obtiver o endereço assiste sem passar pelo login. A recomendação é restringir o compartilhamento às contas da equipe e nunca gravar dados de cliente nos vídeos.

### Conteúdo e escrita

- Linguagem simples e direta, voltada a quem está resolvendo um problema sob pressão.
- Todo artigo começa pelo objetivo e pelo público, não pelo histórico.
- Prints com informação sensível de cliente devem ser tratados antes da publicação, em respeito à LGPD.

### Desempenho e disponibilidade

- Resultado de busca em menos de um segundo para o acervo previsto.
- Leitura confortável em celular, já que suporte e implantação consultam em campo.

## 8. Fora do escopo

- Acesso de clientes ou de qualquer público externo.
- Edição simultânea do mesmo artigo por várias pessoas ao mesmo tempo.
- Tradução para outros idiomas.
- Chamados e atendimento: a plataforma documenta, não substitui a ferramenta de suporte.
- Hospedagem de arquivos de vídeo dentro da própria aplicação.

## 9. Decisões tomadas

| # | Decisão | Definição |
|---|---|---|
| 1 | Quem escreve | Analista de QA como autor e o gestor como revisor. A equipe entra como colaboradora |
| 2 | Forma de login | Nome de usuário e senha, com contas criadas pelo administrador dentro da plataforma |
| 3 | Vídeos | Hospedados no Google Drive e incorporados no artigo por link |
| 4 | Acervo a migrar | Cerca de quatro documentos, migrados manualmente, sem importador automático |
| 5 | Estrutura de áreas | Configurável pela interface. Não existe lista fixa no programa |
| 6 | Hospedagem | Vercel. A questão do plano será tratada internamente pela empresa |
| 7 | Endereço | Subdomínio do domínio que a empresa já possui, no formato `docs.<domínio da empresa>` |
| 8 | Prazo da primeira entrega | Sexta-feira, 07/08/2026. Ver o recorte na seção 12 |

## 10. Decisões pendentes

| # | Decisão | Por que importa |
|---|---|---|
| 1 | Plano da Vercel a ser usado | O plano gratuito proíbe uso comercial. Ver a seção 11 |
| 2 | Quem administra o domínio da empresa | Necessário para criar o subdomínio e apontá-lo |
| 3 | Base tecnológica da aplicação | Próxima conversa, agora que a hospedagem está definida |
| 4 | O que exatamente precisa estar pronto na sexta | Define o recorte da entrega. Ver a seção 12 |

## 11. Hospedagem, endereço e custos

### O que "interno" significa aqui

Interno quer dizer **quem pode entrar**, e não **de onde a pessoa entra**. Existem dois caminhos possíveis:

| Caminho | Como funciona | Consequência |
|---|---|---|
| Publicado na internet, protegido por login | O endereço existe para qualquer pessoa, mas sem usuário e senha não se vê nada | Suporte e implantação acessam de casa, do cliente ou do celular |
| Servidor dentro da empresa | Só funciona na rede local ou por VPN | Exige servidor, manutenção e VPN. Quem está em campo fica sem acesso |

Como o público inclui implantação e suporte, que trabalham fora do escritório, o primeiro caminho é o indicado. É o mesmo modelo de qualquer ferramenta corporativa na nuvem.

### Endereço de acesso

A empresa já possui domínio, então o endereço será um subdomínio, no formato `docs.<domínio da empresa>`. Não há custo adicional: basta criar o apontamento junto a quem administra o domínio.

Até esse apontamento existir, a plataforma funciona no endereço gratuito da própria Vercel, já com conexão segura. A troca posterior não quebra nada.

### Custo da estrutura

A aplicação precisa de três peças: hospedagem, banco de dados e armazenamento de imagens.

| Peça | Definição | Custo |
|---|---|---|
| Hospedagem | Vercel | Ver a ressalva abaixo |
| Banco de dados | Serviço gerenciado de plano gratuito, com meio gigabyte, muito acima do previsto | R$ 0 |
| Imagens e anexos | Armazenamento gerenciado de plano gratuito, de um a dez gigabytes | R$ 0 |
| Vídeos | Google Drive | Já contratado pela empresa |
| Endereço | Subdomínio do domínio existente | R$ 0 |

**Ressalva registrada sobre a Vercel.** Os termos de uso do plano gratuito, chamado Hobby, permitem apenas uso pessoal e não comercial. Uma base de conhecimento interna de empresa é uso comercial, o que configura descumprimento dos termos e cria risco de suspensão sem aviso prévio, possivelmente durante um atendimento. O plano pago custa cerca de 20 dólares mensais por usuário.

A decisão foi usar a Vercel e tratar a questão do plano internamente. Fica registrado que:

- Nada impede o desenvolvimento e a validação começarem agora.
- A regularização do plano deve acontecer antes de a plataforma virar ferramenta oficial da equipe.
- Se a empresa preferir não pagar, existe caminho gratuito e legítimo, com hospedagem que permite uso comercial no plano gratuito. A troca é possível, mas custa retrabalho quanto mais tarde for feita.

### Direção técnica preliminar

A revisão feita pelo gestor, o envio de imagens e o histórico de versões afastam a opção de manter o conteúdo em arquivos versionados no repositório, pois isso exigiria que o revisor usasse Git.

A direção coerente é uma aplicação web com banco de dados, editor no navegador e armazenamento de arquivos separado. As ferramentas específicas serão escolhidas após a validação deste escopo.

## 12. Recorte para a entrega de sexta-feira

A fase 1 completa não cabe em quatro dias. Tentar entregar tudo significa entregar tudo pela metade, e uma base de conhecimento que falha na primeira consulta perde a confiança da equipe e não se recupera.

A proposta abaixo preserva o que resolve o problema real: as pessoas encontrarem a informação. O que fica para depois é o que melhora o processo de quem escreve, e hoje quem escreve é uma pessoa só.

### Entra até sexta

| Item | Por quê |
|---|---|
| Login e gestão de contas | Sem isso a base não pode ir ao ar |
| Estrutura de áreas configurável | Você precisa criar novas áreas sozinho desde o primeiro dia |
| Editor com texto, imagem e vídeo do Drive | É como o conteúdo entra |
| Publicação com rascunho e publicado | Ciclo mínimo para o gestor conferir antes de liberar |
| Navegação por área, tipo e marcador | É como a equipe circula |
| Busca dentro do conteúdo | É o principal motivo de a base existir |
| Os quatro documentos migrados | Base vazia não é entregável |
| No ar no endereço da Vercel | A equipe precisa conseguir entrar |

### Fica para a semana seguinte

| Item | Consequência de adiar |
|---|---|
| Subdomínio próprio | Depende de quem administra o domínio, o que não está sob nosso controle |
| Ajuste da capa à identidade visual | O padrão já é único em todos os documentos, falta aplicar as cores e a marca oficiais |

**Concluídos além do recorte previsto:** devolução comentada na revisão,
comparação e restauração de versões, contribuição da equipe, importação
de Word e PDF, exportação em PDF e registro de auditoria.

### A confirmar

O que significa "pronto na sexta"? As duas leituras mudam o recorte:

- **Demonstração para o gestor:** cabe com folga e dá para incluir algum item da lista de adiados.
- **No ar com a equipe usando:** o recorte acima é o limite, e ainda exige que os quatro documentos estejam migrados até quinta.

## 13. Critérios de aceite da fase 1

A primeira versão está pronta quando:

- Nenhuma página é acessível sem login, nem mesmo as imagens.
- O administrador consegue criar e desativar uma conta pela própria plataforma.
- O acervo em Word está migrado, classificado e revisado.
- A busca encontra um procedimento a partir de uma mensagem de erro real do sistema.
- Um artigo percorre o ciclo completo: rascunho, revisão, devolução, correção e publicação.
- O histórico permite comparar duas versões e restaurar a anterior.
- A leitura funciona bem no celular.
