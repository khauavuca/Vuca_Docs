import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

/** Tipos de documento que já nascem com a base. Podem ser editados na tela. */
const TIPOS_INICIAIS = [
  {
    nome: "Guia passo a passo",
    slug: "guia",
    descricao: "Ensina a executar uma tarefa do início ao fim.",
    ordem: 1,
  },
  {
    nome: "Procedimento operacional",
    slug: "procedimento",
    descricao: "Define como a equipe deve agir em uma situação padrão.",
    ordem: 2,
  },
  {
    nome: "Referência de configuração",
    slug: "referencia",
    descricao: "Descreve parâmetros, campos e valores possíveis.",
    ordem: 3,
  },
  {
    nome: "Solução de problema",
    slug: "solucao-de-problema",
    descricao: "Parte do sintoma ou da mensagem de erro e chega à correção.",
    ordem: 4,
  },
  {
    nome: "Perguntas frequentes",
    slug: "perguntas-frequentes",
    descricao: "Respostas curtas para dúvidas recorrentes.",
    ordem: 5,
  },
  {
    nome: "Treinamento",
    slug: "treinamento",
    descricao: "Conteúdo didático, geralmente com vídeo.",
    ordem: 6,
  },
  {
    nome: "Glossário",
    slug: "glossario",
    descricao: "Termos e siglas usados na empresa e no sistema.",
    ordem: 7,
  },
];

async function main() {
  const nome = process.env.ADMIN_NOME ?? "Administrador";
  const usuario = process.env.ADMIN_USUARIO ?? "admin";
  const senha = process.env.ADMIN_SENHA;

  if (!senha || senha.length < 8) {
    throw new Error(
      "Defina ADMIN_SENHA no arquivo .env com pelo menos 8 caracteres antes de semear.",
    );
  }

  const senhaHash = await bcrypt.hash(senha, 12);

  const administrador = await db.usuario.upsert({
    where: { usuario },
    // O primeiro administrador definiu a própria senha no arquivo de
    // ambiente, então não cai na troca obrigatória do primeiro acesso.
    update: {
      nome,
      papel: "ADMINISTRADOR",
      ativo: true,
      precisaTrocarSenha: false,
    },
    create: {
      nome,
      usuario,
      senhaHash,
      papel: "ADMINISTRADOR",
      precisaTrocarSenha: false,
    },
  });

  for (const tipo of TIPOS_INICIAIS) {
    await db.tipo.upsert({
      where: { slug: tipo.slug },
      update: { nome: tipo.nome, descricao: tipo.descricao, ordem: tipo.ordem },
      create: tipo,
    });
  }

  console.log(`Administrador pronto: ${administrador.usuario}`);
  console.log(`Tipos de documento cadastrados: ${TIPOS_INICIAIS.length}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
