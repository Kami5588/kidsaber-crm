# KidSaber Connect — CRM da Clínica KidSaber

Sistema completo de gestão (CRM) para clínica multidisciplinar infantil, com Pacientes,
Responsáveis, Profissionais, Sessões/Evoluções, Leads (funil de CRM), Interações,
Lista de Espera, Tarefas, Financeiro (faturas), Convênios, Tabela de Serviços,
Documentos e Pesquisa de Satisfação.

Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + NextAuth (login por
e-mail/senha) + banco SQLite embutido (módulo nativo `node:sqlite` do Node — sem
dependências externas de banco de dados).

## Rodando localmente

Requisitos: Node.js 22.5 ou superior.

```bash
npm install
npm run seed   # cria o banco com um usuário admin e dados de exemplo
npm run dev    # http://localhost:3000
```

Login inicial:
- **E-mail:** admin@kidsaber.com.br
- **Senha:** kidsaber123

**Troque essa senha assim que possível** (crie um novo usuário direto no banco ou
peça para eu adicionar uma tela de gestão de usuários).

## Build de produção

```bash
npm run build
npm run start
```

## Estrutura

- `src/lib/schema.sql` — schema do banco (todas as tabelas)
- `src/lib/entities.ts` — configuração de cada módulo (campos, tipos, relações) —
  é aqui que se adicionam/editam campos e módulos novos
- `src/lib/orm.ts` — camada de acesso genérica ao banco (CRUD)
- `src/lib/actions.ts` — server actions (criar/editar/excluir) usadas por todos os módulos
- `src/app/(app)/[entity]/...` — páginas genéricas de listagem/criação/edição,
  reaproveitadas por todos os módulos a partir da config em `entities.ts`
- `src/app/(app)/dashboard` — painel com indicadores
- `src/app/login` — tela de login

## Paleta de cores (baseada na logo da KidSaber)

- Azul-marinho `#1E3A5F` (primária)
- Amarelo `#F5C518` (destaque/ações)
- Coral `#EF4258` (alertas/secundária)
- Turquesa `#2CB1C7` (apoio)

## Próximos passos sugeridos

- Deploy em um domínio próprio (posso ajudar via Railway, Vercel, etc.)
- Tela de gestão de usuários/permissões por perfil (admin, profissional, responsável)
- Upload real de arquivos (documentos, fotos) — hoje o campo aceita um link/URL
- Notificações automáticas (WhatsApp/e-mail) para lembretes de sessão e cobranças
