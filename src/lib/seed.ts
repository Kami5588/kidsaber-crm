import bcrypt from "bcryptjs";
import { db } from "./db";
import { insertRow, rawAll, rawGet, updateRow } from "./orm";
import { generatePassword } from "./users";

/** Contato geral, usado por profissionais que atendem em mais de uma unidade. */
const TELEFONE_GERAL = "(67) 99244-4152";
const EMAIL_GERAL = "contato@clinickidsaber.com.br";

/**
 * Unidades da rede: sede em Mundo Novo, filiais em Guaíra e Terra Roxa.
 *
 * Roda separado do seed de demonstração porque bancos que já existem em
 * produção nunca passariam pelo ensureSeeded (que só age em base vazia) e
 * ficariam sem nenhuma unidade cadastrada.
 *
 * Os endereços ficam vazios de propósito: serão preenchidos pela clínica na
 * tela de Unidades. Melhor um campo em branco do que um endereço inventado
 * aparecendo no site público.
 */
export function ensureUnits(): Record<string, string> {
  const existing = rawAll("SELECT id, name FROM Unit");
  if (existing.length > 0) {
    return Object.fromEntries(existing.map((u) => [u.name, u.id]));
  }

  const mundoNovo = insertRow("Unit", {
    name: "Mundo Novo",
    city: "Mundo Novo",
    state: "MS",
    address: "Rua Voluntários da Pátria, 343 - Centro, CEP 79980-000",
    phone: "(67) 99244-4152",
    email: EMAIL_GERAL,
    isMain: 1,
    status: "Ativo",
  });
  const guaira = insertRow("Unit", {
    name: "Guaíra",
    city: "Guaíra",
    state: "PR",
    address: "Rua Professor Galvoso, 813 - Centro, CEP 85980-085",
    phone: "(44) 99135-2175",
    email: EMAIL_GERAL,
    isMain: 0,
    status: "Ativo",
  });
  const terraRoxa = insertRow("Unit", {
    name: "Terra Roxa",
    city: "Terra Roxa",
    state: "PR",
    address: "Av. Pres. Castelo Branco, 165 - Centro, CEP 85990-000",
    phone: "(44) 99125-4410",
    email: EMAIL_GERAL,
    isMain: 0,
    status: "Ativo",
  });

  console.log("Unidades criadas: Mundo Novo (sede), Guaíra, Terra Roxa.");
  return { mundoNovo, guaira, terraRoxa };
}

/**
 * Conta de administração principal da clínica.
 *
 * Roda separada do seed de demonstração porque precisa existir também em bases
 * que já têm dados. Se a conta já existe, nada é alterado — a senha em uso não
 * é sobrescrita a cada reinício.
 */
export function ensureOwnerAdmin(): void {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!email) return;

  const existing = rawGet("SELECT id FROM User WHERE lower(email) = ?", [email]);

  if (existing) {
    // Recuperação de acesso: com ADMIN_PASSWORD_RESET ligado, a senha da conta
    // principal volta a ser a de ADMIN_PASSWORD. Serve para quando a senha se
    // perde e não há outro administrador para redefini-la pela tela.
    const reset = (process.env.ADMIN_PASSWORD_RESET ?? "").trim().toLowerCase();
    const novaSenha = process.env.ADMIN_PASSWORD?.trim();

    if ((reset === "1" || reset === "true") && novaSenha) {
      updateRow("User", existing.id as string, {
        passwordHash: bcrypt.hashSync(novaSenha, 10),
        active: 1,
        mustChangePassword: 0,
      });
      // Zera o bloqueio por tentativas, senão a conta seguiria travada.
      rawAll("DELETE FROM LoginAttempt WHERE identifier = ?", [email]);
      console.log("Senha do administrador principal redefinida:", email);
      console.log("Remova ADMIN_PASSWORD_RESET das variáveis apos entrar.");
    }
    return;
  }

  const password = process.env.ADMIN_PASSWORD?.trim() || generatePassword();
  const generated = !process.env.ADMIN_PASSWORD?.trim();

  insertRow(
    "User",
    {
      name: process.env.ADMIN_NAME?.trim() || "Administração KidSaber",
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "ADMIN",
      title: null,
      jobTitle: "Administradora",
      active: 1,
      // Senha definida por quem instalou não precisa de troca forçada;
      // senha gerada aqui, sim.
      mustChangePassword: generated ? 1 : 0,
    },
    { withTimestamps: true }
  );

  console.log("Administrador principal criado:", email);
  if (generated) console.log("Senha inicial gerada:", password);
}


/** Endereço e telefone oficiais de cada unidade, conferidos com a clínica. */
const UNIT_CONTACTS: Record<string, { address: string; phone: string }> = {
  "Mundo Novo": {
    address: "Rua Voluntários da Pátria, 343 - Centro, CEP 79980-000",
    phone: "(67) 99244-4152",
  },
  "Guaíra": {
    address: "Rua Professor Galvoso, 813 - Centro, CEP 85980-085",
    phone: "(44) 99135-2175",
  },
  "Terra Roxa": {
    address: "Av. Pres. Castelo Branco, 165 - Centro, CEP 85990-000",
    phone: "(44) 99125-4410",
  },
};

/**
 * Completa endereço e telefone das unidades que ainda estão em branco.
 *
 * O ensureUnits só age em banco vazio, então bases já em produção nunca
 * receberiam esses dados. Aqui o preenchimento é feito campo a campo e apenas
 * quando o valor está vazio: se a clínica editou algo pela tela, a edição dela
 * prevalece.
 */
export function ensureUnitContacts(): void {
  // Correção pontual: enquanto o telefone de Terra Roxa era desconhecido, a
  // unidade ficou com o número de Guaíra. Como o campo não está vazio, a regra
  // geral abaixo não o alcança — por isso o conserto explícito, restrito a
  // esse valor exato para não tocar em nada que a clínica tenha editado.
  const terraRoxa = rawGet(
    "SELECT id, phone FROM Unit WHERE name = ? AND phone = ?",
    ["Terra Roxa", "(44) 99135-2175"]
  );
  if (terraRoxa) {
    updateRow("Unit", terraRoxa.id as string, { phone: "(44) 99125-4410" });
    console.log("Telefone de Terra Roxa corrigido.");
  }

  for (const unit of rawAll("SELECT id, name, address, phone FROM Unit")) {
    const known = UNIT_CONTACTS[unit.name as string];
    if (!known) continue;

    const patch: Record<string, string> = {};
    if (!String(unit.address ?? "").trim()) patch.address = known.address;
    if (!String(unit.phone ?? "").trim()) patch.phone = known.phone;

    if (Object.keys(patch).length > 0) {
      updateRow("Unit", unit.id as string, patch);
      console.log("Contato preenchido na unidade:", unit.name);
    }
  }
}

/**
 * Preparo de uma instalação nova.
 *
 * Cria apenas o que é real: as três unidades da clínica. Não há mais cadastro
 * de demonstração aqui — paciente, profissional, convênio, tabela de preços e
 * contas de teste eram dados inventados que, numa base de produção, se
 * confundem com os de verdade e aparecem na tela para quem for usar o sistema.
 *
 * O acesso inicial vem de ensureOwnerAdmin, a partir de ADMIN_EMAIL. Sem essa
 * variável a instalação sobe sem nenhuma conta — o que é melhor do que subir
 * com uma conta de senha conhecida.
 */
export function ensureSeeded() {
  ensureUnits();

  const temConta = (db.prepare("SELECT COUNT(*) as c FROM User").get() as any).c > 0;
  const temAdminEmail = Boolean((process.env.ADMIN_EMAIL ?? "").trim());

  if (!temConta && !temAdminEmail) {
    console.warn(
      "Nenhuma conta de acesso e nenhum ADMIN_EMAIL definido: " +
        "configure ADMIN_EMAIL (e ADMIN_PASSWORD) para criar o primeiro acesso."
    );
  }
}
