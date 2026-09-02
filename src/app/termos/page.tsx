import Link from "next/link";
import { getServerSession } from "next-auth";
import { FileText, AlertTriangle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { EMAIL, PHONE_DISPLAY } from "@/lib/clinic";

export const metadata = {
  title: "Termos de Uso · Clínica KidSaber",
  description:
    "Condições de uso do site da Clínica KidSaber, incluindo o formulário de contato e o acesso à área restrita da equipe.",
};

const Pend = ({ children }: { children: React.ReactNode }) => (
  <span className="pending">{children}</span>
);

const ATUALIZADO_EM = "29 de agosto de 2026";

export default async function TermosPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader isLoggedIn={!!session} anchors={false} />

      <main className="flex-1">
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-3xl px-6 py-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-navy-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-navy-700">
              <FileText className="h-3.5 w-3.5" />
              Condições de uso
            </span>
            <h1 className="mt-5 text-3xl font-bold text-navy-800 sm:text-4xl">Termos de Uso</h1>
            <p className="mt-4 text-slate-600">
              Ao navegar neste site ou utilizar o formulário de contato, você concorda com as
              condições descritas abaixo. Recomendamos a leitura atenta.
            </p>
            <p className="mt-3 text-sm text-slate-600">Última atualização: {ATUALIZADO_EM}.</p>
          </div>
        </div>

        <article className="legal mx-auto max-w-3xl px-6 py-12">
          {/* Aviso de saúde: precisa saltar aos olhos, não ficar diluído no corpo do texto. */}
          <div className="mb-10 flex gap-3 rounded-2xl border border-coral-200 bg-coral-50 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-coral-600" />
            <div>
              <p className="mb-1 font-bold text-coral-800">
                Este site não é um canal de emergência
              </p>
              <p className="text-sm leading-relaxed text-coral-900/80">
                O formulário de contato não é monitorado em tempo integral e não substitui
                atendimento médico. Em caso de urgência ou emergência, procure imediatamente um
                serviço de pronto atendimento ou ligue para o SAMU (192).
              </p>
            </div>
          </div>

          <h2>1. Objeto</h2>
          <p>
            Estes termos regulam o uso do site institucional da <strong>Clínica KidSaber</strong>,
            inscrita no CNPJ sob o n.º <Pend>[PREENCHER: CNPJ]</Pend>, cuja finalidade é apresentar
            os serviços prestados, informar a localização das unidades e receber solicitações de
            contato das famílias interessadas.
          </p>

          <h2>2. Quem pode utilizar</h2>
          <p>
            O formulário de contato destina-se a pessoas maiores de 18 anos, na condição de pais ou
            responsáveis legais pela criança para a qual se busca atendimento. Ao enviar a
            solicitação, você declara possuir essa condição e autoriza o retorno da nossa equipe
            pelos meios informados.
          </p>

          <h2>3. Natureza das informações publicadas</h2>
          <p>
            Os conteúdos deste site têm caráter meramente informativo sobre as especialidades
            oferecidas. <strong>Nada aqui publicado constitui diagnóstico, orientação terapêutica ou
            recomendação de tratamento</strong>, os quais dependem de avaliação individual realizada
            presencialmente por profissional habilitado.
          </p>

          <h2>4. Formulário de contato</h2>
          <p>Ao utilizar o formulário, você compreende que:</p>
          <ul>
            <li>O envio da mensagem <strong>não constitui agendamento</strong>; a data do atendimento só se confirma após contato da nossa equipe</li>
            <li>O retorno ocorre dentro do horário de funcionamento da unidade escolhida</li>
            <li>A disponibilidade de horários varia conforme a especialidade e pode haver lista de espera</li>
            <li>Não devem ser enviados dados de saúde detalhados pelo formulário; essas informações são coletadas com a devida proteção no momento da avaliação</li>
          </ul>
          <p>
            As informações enviadas são registradas no sistema interno da clínica e utilizadas
            exclusivamente para o retorno do contato, conforme a nossa{" "}
            <Link href="/privacidade">Política de Privacidade</Link>.
          </p>

          <h2>5. Área restrita</h2>
          <p>
            O acesso ao sistema de gestão é exclusivo dos profissionais e colaboradores autorizados
            da clínica. As credenciais são pessoais e intransferíveis, e o usuário é responsável por
            mantê-las em sigilo, respondendo pelas ações praticadas com o seu acesso.
          </p>
          <p>
            São expressamente vedadas as tentativas de acesso não autorizado, a exploração de
            vulnerabilidades e a extração automatizada de dados. Tais condutas podem configurar
            crime, nos termos do artigo 154-A do Código Penal.
          </p>

          <h2>6. Propriedade intelectual</h2>
          <p>
            A marca, o logotipo, os textos, o layout e os demais elementos deste site pertencem à
            Clínica KidSaber e são protegidos pela legislação de propriedade intelectual. A
            reprodução total ou parcial sem autorização prévia por escrito é proibida.
          </p>

          <h2>7. Disponibilidade do serviço</h2>
          <p>
            Empregamos esforços para manter o site disponível de forma contínua, mas o acesso pode
            ser interrompido temporariamente para manutenção, atualização ou por motivos técnicos
            alheios à nossa vontade, sem que isso gere direito a indenização.
          </p>

          <h2>8. Limitação de responsabilidade</h2>
          <p>
            A Clínica KidSaber não se responsabiliza por danos decorrentes do uso indevido do site,
            da impossibilidade momentânea de acesso, de falhas na conexão do usuário ou do envio de
            informações incorretas no formulário de contato.
          </p>

          <h2>9. Alterações destes termos</h2>
          <p>
            Estes termos podem ser revisados a qualquer momento. A versão vigente é sempre a
            publicada nesta página, com a respectiva data de atualização. O uso continuado do site
            após eventuais alterações implica concordância com o novo texto.
          </p>

          <h2>10. Legislação aplicável e foro</h2>
          <p>
            Estes termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de{" "}
            <Pend>[PREENCHER: comarca da sede]</Pend> para dirimir controvérsias decorrentes
            destes termos, com renúncia a qualquer outro, por mais privilegiado que seja.
          </p>

          <h2>11. Contato</h2>
          <p>
            Dúvidas sobre estes termos podem ser encaminhadas para{" "}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a> ou pelo telefone {PHONE_DISPLAY}. Os
            endereços das unidades estão na <Link href="/#unidades">página inicial</Link>.
          </p>

          <p className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
            Consulte também a nossa{" "}
            <Link href="/privacidade">Política de Privacidade</Link>.
          </p>
        </article>
      </main>

      <SiteFooter anchors={false} />
    </div>
  );
}
