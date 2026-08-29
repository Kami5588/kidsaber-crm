import Link from "next/link";
import { getServerSession } from "next-auth";
import { ShieldCheck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Política de Privacidade · Clínica KidSaber",
  description:
    "Como a Clínica KidSaber coleta, usa, armazena e protege os dados pessoais de pacientes, responsáveis e visitantes do site.",
};

/** Trecho que depende de dado cadastral da clínica e ainda não foi preenchido. */
const Pend = ({ children }: { children: React.ReactNode }) => (
  <span className="pending">{children}</span>
);

const ATUALIZADO_EM = "29 de agosto de 2026";

export default async function PrivacidadePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader isLoggedIn={!!session} anchors={false} />

      <main className="flex-1">
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-3xl px-6 py-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Proteção de dados
            </span>
            <h1 className="mt-5 text-3xl font-bold text-navy-800 sm:text-4xl">
              Política de Privacidade
            </h1>
            <p className="mt-4 text-slate-600">
              Esta política explica quais dados pessoais a Clínica KidSaber coleta, para que os
              utiliza e quais são os seus direitos, em conformidade com a Lei n.º 13.709/2018
              (Lei Geral de Proteção de Dados Pessoais — LGPD).
            </p>
            <p className="mt-3 text-sm text-slate-500">Última atualização: {ATUALIZADO_EM}.</p>
          </div>
        </div>

        <article className="legal mx-auto max-w-3xl px-6 py-12">
          <h2>1. Quem é o responsável pelos seus dados</h2>
          <p>
            O controlador dos dados pessoais tratados por meio deste site e do sistema interno de
            gestão é a <strong>Clínica KidSaber</strong>, inscrita no CNPJ sob o
            n.º <Pend>[PREENCHER: CNPJ]</Pend>, com sede em <Pend>[PREENCHER: endereço completo da sede]</Pend>,
            no município de Mundo Novo, Mato Grosso do Sul, e filiais em Guaíra e Terra Roxa, no Paraná.
          </p>
          <p>
            Para tratar de qualquer assunto relacionado a esta política ou aos seus dados pessoais,
            o contato é <Pend>[PREENCHER: e-mail do encarregado de dados]</Pend>.
          </p>

          <h2>2. Quais dados coletamos</h2>
          <h3>2.1. Visitantes do site</h3>
          <p>
            Quando você preenche o formulário de contato, coletamos apenas o que você mesmo informa:
          </p>
          <ul>
            <li>Nome</li>
            <li>Endereço de e-mail</li>
            <li>Telefone ou WhatsApp, se informado</li>
            <li>Unidade e especialidade de interesse</li>
            <li>O conteúdo da mensagem enviada</li>
          </ul>
          <p>
            Não utilizamos ferramentas de rastreamento publicitário nem compartilhamos esses dados
            com redes de anúncios.
          </p>

          <h3>2.2. Pacientes e responsáveis</h3>
          <p>
            Quando o atendimento é contratado, passamos a tratar os dados necessários à prestação do
            serviço de saúde:
          </p>
          <ul>
            <li>Dados de identificação da criança: nome, data de nascimento e, quando aplicável, CPF</li>
            <li>Dados do responsável legal: nome, parentesco, CPF, endereço, telefone e e-mail</li>
            <li>
              <strong>Dados de saúde</strong>: diagnósticos informados, especialidades em
              acompanhamento, registros de evolução das sessões, relatórios e documentos anexados
            </li>
            <li>Dados de convênio, quando houver</li>
            <li>Dados financeiros do atendimento: valores, vencimentos e pagamentos</li>
          </ul>
          <p>
            Os dados de saúde são classificados pela LGPD como <strong>dados pessoais sensíveis</strong> e
            recebem proteção reforçada, conforme descrito nos itens 6 e 7 desta política.
          </p>

          <h2>3. Para que usamos os dados</h2>
          <ul>
            <li>Responder às solicitações de contato e orientar sobre o próximo passo do atendimento</li>
            <li>Realizar o cadastro, o agendamento e o acompanhamento terapêutico dos pacientes</li>
            <li>Registrar a evolução das sessões e elaborar relatórios para a família e, quando autorizado, para a escola</li>
            <li>Emitir cobranças e controlar os pagamentos dos atendimentos</li>
            <li>Cumprir obrigações legais e regulatórias aplicáveis aos serviços de saúde</li>
          </ul>
          <p>
            Não utilizamos os dados para finalidades diferentes das informadas, nem os vendemos a
            terceiros em nenhuma hipótese.
          </p>

          <h2>4. Com que fundamento tratamos os dados</h2>
          <ul>
            <li>
              <strong>Consentimento</strong>, para o envio do formulário de contato e para o retorno
              comercial subsequente
            </li>
            <li>
              <strong>Execução de contrato</strong>, para as atividades necessárias à prestação do
              serviço contratado
            </li>
            <li>
              <strong>Tutela da saúde</strong>, prevista no artigo 11, inciso II, alínea “f” da LGPD,
              para o tratamento de dados de saúde realizado por profissionais de saúde
            </li>
            <li>
              <strong>Cumprimento de obrigação legal</strong>, para a guarda de registros e documentos
              exigidos pela legislação
            </li>
          </ul>

          <h2>5. Compartilhamento com terceiros</h2>
          <p>Os dados podem ser compartilhados apenas nas seguintes situações:</p>
          <ul>
            <li>Com os profissionais de saúde da clínica diretamente envolvidos no atendimento</li>
            <li>Com operadoras de planos de saúde, quando o atendimento for realizado por convênio e mediante autorização</li>
            <li>Com o provedor de hospedagem do sistema, que atua como operador e apenas armazena os dados</li>
            <li>Com autoridades públicas, quando houver determinação legal ou judicial</li>
          </ul>
          <p>
            Os relatórios de evolução só são enviados a escolas ou a outros profissionais externos
            mediante autorização expressa do responsável legal.
          </p>

          <h2>6. Dados de crianças e adolescentes</h2>
          <p>
            A atividade da clínica envolve o tratamento de dados de crianças, o que exige cuidado
            adicional. Conforme o artigo 14 da LGPD, esses dados são tratados{" "}
            <strong>no melhor interesse da criança</strong> e mediante o{" "}
            <strong>consentimento específico e destacado de ao menos um dos pais ou do responsável
            legal</strong>.
          </p>
          <p>
            Não solicitamos dados diretamente às crianças e não condicionamos a participação em
            qualquer atividade ao fornecimento de informações além do estritamente necessário para o
            atendimento.
          </p>

          <h2>7. Como protegemos os dados</h2>
          <ul>
            <li>O sistema de gestão é de acesso restrito, protegido por login e senha individuais</li>
            <li>As senhas são armazenadas de forma criptografada e não podem ser lidas por ninguém</li>
            <li>O acesso às informações clínicas é limitado aos profissionais envolvidos no atendimento e à direção</li>
            <li>A comunicação com o site é protegida por conexão criptografada (HTTPS)</li>
            <li>Os dados são armazenados em ambiente com rotina de backup</li>
          </ul>

          <h2>8. Por quanto tempo guardamos</h2>
          <p>
            Os contatos recebidos pelo site que não resultarem em atendimento são mantidos pelo
            tempo necessário ao retorno comercial e posteriormente descartados.
          </p>
          <p>
            Os registros de pacientes, incluindo prontuários e relatórios de evolução, são mantidos
            pelo prazo exigido pela legislação e pelas normas dos conselhos profissionais das
            respectivas especialidades, ainda que o tratamento tenha sido encerrado.
          </p>

          <h2>9. Seus direitos</h2>
          <p>
            A LGPD assegura ao titular dos dados — ou ao responsável legal, no caso de crianças — os
            seguintes direitos:
          </p>
          <ul>
            <li>Confirmar se tratamos dados a seu respeito e acessá-los</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
            <li>Solicitar a anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desconformidade com a lei</li>
            <li>Solicitar a portabilidade dos dados a outro prestador de serviço</li>
            <li>Revogar o consentimento a qualquer momento</li>
            <li>Ser informado sobre com quem compartilhamos seus dados</li>
          </ul>
          <p>
            Para exercer qualquer desses direitos, entre em contato pelo e-mail{" "}
            <Pend>[PREENCHER: e-mail do encarregado de dados]</Pend>. A solicitação será respondida
            nos prazos previstos em lei.
          </p>
          <p>
            Vale registrar que a eliminação de dados pode ser limitada quando houver obrigação legal
            de guarda do prontuário, hipótese em que informaremos o motivo da recusa.
          </p>

          <h2>10. Cookies</h2>
          <p>
            Este site utiliza apenas os recursos de armazenamento necessários ao seu funcionamento,
            como a manutenção da sessão de quem acessa a área restrita. Não empregamos cookies de
            publicidade ou de rastreamento de comportamento entre sites.
          </p>

          <h2>11. Alterações nesta política</h2>
          <p>
            Esta política pode ser atualizada para refletir mudanças nos nossos processos ou na
            legislação. A data da última atualização está indicada no início da página. Alterações
            relevantes serão comunicadas pelos canais de atendimento.
          </p>

          <p className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
            Consulte também os nossos{" "}
            <Link href="/termos">Termos de Uso</Link>.
          </p>
        </article>
      </main>

      <SiteFooter anchors={false} />
    </div>
  );
}
