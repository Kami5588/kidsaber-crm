/**
 * Dados institucionais da clínica.
 *
 * Ficam centralizados aqui para que telefone, e-mail e redes apareçam iguais no
 * site inteiro e mudem em um lugar só. Dados operacionais das unidades
 * (endereço, telefone próprio) vêm do banco, não daqui.
 */

export const CLINIC_NAME = "Clínica KidSaber";
export const CLINIC_TAGLINE = "Desenvolvimento infantil";

export const PHONE_DISPLAY = "(67) 99244-4152";
/** Somente dígitos, com país e DDD, no formato exigido pelo link do WhatsApp. */
export const PHONE_E164 = "5567992444152";

export const EMAIL = "contato@clinickidsaber.com.br";

export const WHATSAPP_MESSAGE =
  "Olá! Vim pelo site e gostaria de saber mais sobre os atendimentos da KidSaber.";

export const WHATSAPP_URL = `https://wa.me/${PHONE_E164}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

export const BUSINESS_HOURS = "Segunda a sexta, a partir das 8h";

/**
 * Suporte técnico do sistema.
 *
 * Diferente do e-mail de atendimento da clínica: este é o canal da equipe para
 * relatar problemas ou pedir ajuda com o KidSaber Connect.
 */
export const SUPPORT_EMAIL = "kamileaikonodakm@gmail.com";
export const SUPPORT_NAME = "Kamile Aiko Noda";

/** Redes sociais. Deixe vazio para o link não aparecer no rodapé. */
export const SOCIAL = {
  instagram: "https://www.instagram.com/kidsabermundonovo",
  facebook: "",
  youtube: "",
};
