/**
 * Dados institucionais da clínica.
 *
 * Ficam centralizados aqui para que telefone, e-mail e redes apareçam iguais no
 * site inteiro e mudem em um lugar só. Dados operacionais das unidades
 * (endereço, telefone próprio) vêm do banco, não daqui.
 */

export const CLINIC_NAME = "Clínica KidSaber";
export const CLINIC_TAGLINE = "Desenvolvimento infantil";

export const PHONE_DISPLAY = "(44) 99840-0554";
/** Somente dígitos, com país e DDD, no formato exigido pelo link do WhatsApp. */
export const PHONE_E164 = "5544998400554";

export const EMAIL = "contato@clinickidsaber.com.br";

export const WHATSAPP_MESSAGE =
  "Olá! Vim pelo site e gostaria de saber mais sobre os atendimentos da KidSaber.";

export const WHATSAPP_URL = `https://wa.me/${PHONE_E164}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

export const BUSINESS_HOURS = "Segunda a sexta, das 8h às 18h";

/** Redes sociais. Deixe vazio para o link não aparecer no rodapé. */
export const SOCIAL = {
  instagram: "",
  facebook: "",
  youtube: "",
};
