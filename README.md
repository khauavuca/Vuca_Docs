# Vuca Docs

Base de conhecimento interna da Vuca. Acesso restrito à equipe, com login
obrigatório em toda a aplicação, inclusive nas imagens.

O escopo completo está em [docs/escopo.md](docs/escopo.md).

## Como funciona

| Peça | Escolha |
|---|---|
| Aplicação | Next.js com App Router e TypeScript |
| Banco de dados | PostgreSQL, acessado pelo Prisma |
| Imagens e anexos | Balde privado no Supabase Storage |
| Vídeos | Google Drive, incorporados por link |
| Editor | TipTap, com imagem, tabela, código e vídeo |
| Importação | .docx pelo Mammoth e .pdf pelo pdf-parse, com extração de figuras |
| Acesso | Usuário e senha, sessão em cookie assinado |

## Perfis de acesso

| Perfil | O que pode fazer |
|---|---|
| Leitor | Ler e buscar |
| Colaborador | Criar rascunho e sugerir correção |
| Autor | Escrever e enviar para revisão |
| Revisor | Publicar, tirar do ar e excluir |
| Administrador | Tudo, mais áreas, tipos e contas |

## Instalação

Precisa de Node 20 ou superior.

### 1. Instalar as dependências

```bash
npm install
```

### 2. Criar o banco e o armazenamento

No Supabase, crie um projeto e depois:

- copie as duas cadeias de conexão do PostgreSQL, a do pooler e a direta;
- em Storage, crie um balde chamado `anexos` e **mantenha-o privado**.

O balde precisa ficar privado. É isso que impede uma imagem da base de ser
aberta por quem não fez login.

### 3. Preencher o arquivo de variáveis

Copie o modelo:

```bash
cp .env.example .env
```

Gere o segredo da sessão e cole em `SESSAO_SEGREDO`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Preencha também `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` e a senha do primeiro administrador em
`ADMIN_SENHA`.

### 4. Criar as tabelas

```bash
npx prisma migrate dev --name inicial
```

### 5. Criar o primeiro administrador e os tipos de documento

```bash
npm run semear
```

### 6. Rodar

```bash
npm run dev
```

Acesse http://localhost:3000, entre com o usuário e a senha definidos em
`ADMIN_USUARIO` e `ADMIN_SENHA`, e comece criando as áreas em
**Administração › Áreas e tipos**.

## Publicação na Vercel

1. Suba o projeto para o repositório Git.
2. Importe o repositório na Vercel.
3. Repita todas as variáveis do `.env` nas configurações do projeto.
4. A Vercel detecta o Next.js sozinha. O comando de construção já roda
   `prisma generate`.

O primeiro endereço será o gratuito da própria Vercel. Depois, aponte o
subdomínio `docs` do domínio da empresa para a hospedagem.

> **Registrado no escopo:** o plano gratuito da Vercel permite apenas uso
> pessoal e não comercial. Antes de a base virar ferramenta oficial da
> equipe, a situação do plano precisa ser resolvida.

## Notas de versão

Seção separada dos Comunicados, porque tem forma própria — a mesma
estrutura do relatório de Release Notes do Jira: produto/sistema,
número de versão, data de lançamento, e uma lista de itens agrupados
por tipo (Novidade, Melhoria, Correção, Outra alteração). Quem publica
cria em **Administração › Notas de versão**; a leitura fica em
**Notas de versão**, no menu lateral, filtrável por produto — útil
porque o ecossistema Vuca tem mais de um sistema (PDV, Vuca Totem,
retaguarda...).

## Leitura do documento

O documento abre com um cabeçalho simples — área, tipo, título, resumo e
os dados de autoria — e o conteúdo flui numa coluna só, sem moldura de
cartão, no espírito de um site de documentação de referência (Cypress
Docs, Stripe Docs). Não existe capa separada nem divisão em blocos por
página: essa abordagem foi tentada e abandonada por ser frágil na
impressão (uma imagem em resolução nativa facilmente é mais alta que uma
folha de papel, e forçar o encaixe quebrava o layout no meio).

A impressão e a exportação em PDF (botão "Baixar em PDF", que aciona a
impressão do navegador) usam o mesmo HTML da leitura, com margem de
página comum e cuidado para não cortar título, imagem ou tabela no meio.

## Importação: o que a conversão trata sozinha

- Uma caixa de aviso criada no Word como tabela de uma célula (comum
  para marcar onde entra um print) é desmontada: fica só a legenda e a
  imagem, sem a borda do arquivo original.
- A ordem das figuras soltas é lida do próprio `document.xml`, não do
  nome dos arquivos — é isso que faz uma figura cair perto do texto
  certo, e não na ordem em que foi salva internamente pelo Word.
- Uma figura que só existe no cabeçalho ou rodapé do arquivo (logotipo,
  marca d'água repetida) é descartada: não é um passo do procedimento,
  é papel timbrado do arquivo original, e a plataforma já tem o próprio.
- Se uma figura falhar ao subir — por exemplo, por um limite de tamanho
  configurado no balde do Supabase —, só aquela figura é pulada; o
  resto do documento não se perde por causa dela.

## Testes

```bash
npm run teste
```

A cobertura é das regras que quebram em silêncio: limpeza do HTML do
editor, comparação entre versões, normalização usada pela busca e a
estruturação do texto vindo de PDF. Tela e banco não são testados aqui
— são verificados no uso.

`src/lib/paginar.ts` e seu teste ficaram órfãos depois que o layout
passou a ser um documento contínuo (ver acima). Ainda passam, mas nada
mais os importa; podem ser apagados numa limpeza.

## Estrutura do código

```
prisma/          Modelo de dados e semeadura inicial
src/actions/     Ações de servidor: autenticação, artigos, estrutura, contas
src/app/         Páginas. O grupo (base) exige sessão
src/components/  Editor, casca da aplicação e peças de tela
src/lib/         Banco, sessão, senha, limpeza de HTML, busca e armazenamento
src/middleware.ts  Porta de entrada: sem sessão, ninguém passa
```

## Decisões de segurança

- Nenhuma página é acessível sem sessão. O middleware cobre a aplicação inteira.
- As imagens saem apenas pela rota `/api/anexos/[id]`, que confere a sessão.
- O conteúdo do editor é limpo antes de ser gravado e outra vez ao ser exibido.
- Vídeo só é aceito se o endereço for do Google Drive.
- Senhas são guardadas com bcrypt. O acesso trava por 15 minutos após 5 erros.
- Senha criada ou redefinida pelo administrador é provisória: a pessoa
  troca no primeiro acesso e a navegação fica presa até isso acontecer.
  Assim ninguém, nem o administrador, conhece a senha de outra pessoa.
- Trocar a própria senha exige informar a senha atual.
- A resposta do login não diz se o erro foi no usuário ou na senha.
- Buscadores são bloqueados por cabeçalho e por `robots.txt`.

## O que ficou para a próxima entrega

- Subdomínio próprio (`docs.<domínio da empresa>`), depende de quem
  administra o DNS da empresa.
- Regularizar o plano da Vercel: o gratuito (Hobby) proíbe uso comercial.
- Limpar `src/lib/paginar.ts` e `paginar.teste.ts`, órfãos desde a
  simplificação do layout.
