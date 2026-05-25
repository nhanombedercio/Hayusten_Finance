import nodemailer from 'nodemailer';
import { logger } from './logger.js';

// Transporter singleton — reutilizado em todos os envios para não recriar a pool SMTP por pedido.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SEGURO === 'true',
  auth: {
    user: process.env.EMAIL_UTILIZADOR,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const BASE_URL = process.env.FRONTEND_URL || 'https://app.hayusten.com';
const REMETENTE = process.env.EMAIL_REMETENTE || 'Hayusten Finance <noreply@hayusten.com>';

// Envolve cada email numa estrutura HTML consistente com branding Hayusten.
function moldura(conteudo) {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>
    body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;}
    .container{max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;}
    .header{background:#4f46e5;padding:24px 32px;}
    .header h1{color:#fff;margin:0;font-size:24px;}
    .body{padding:32px;}
    .body p{color:#374151;line-height:1.6;margin:0 0 16px;}
    .btn{display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;
         text-decoration:none;font-weight:bold;margin:16px 0;}
    .footer{background:#f9fafb;padding:16px 32px;text-align:center;}
    .footer p{color:#9ca3af;font-size:12px;margin:0;}
    .destaque{background:#f0f9ff;border-left:4px solid #4f46e5;padding:12px 16px;margin:16px 0;
              border-radius:0 4px 4px 0;}
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Hayusten Finance</h1></div>
    <div class="body">${conteudo}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Hayusten Finance. Todos os direitos reservados.</p>
      <p>Este email foi enviado porque tem uma conta no Hayusten Finance.</p>
    </div>
  </div>
</body>
</html>`;
}

async function enviar({ para, assunto, html }) {
  try {
    await transporter.sendMail({
      from: REMETENTE,
      to: para,
      subject: assunto,
      html,
    });
    logger.info('Email enviado', { para, assunto });
  } catch (err) {
    // Log detalhado mas não interrompe o fluxo — o email pode ser reenviado via BullMQ.
    logger.error('Falha ao enviar email', { para, assunto, erro: err.message });
    throw err;
  }
}

export async function enviarConfirmacaoEmail(destinatario, nome, linkActivacao) {
  await enviar({
    para: destinatario,
    assunto: 'Confirme o seu endereço de email — Hayusten Finance',
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>Bem-vindo ao Hayusten Finance. Para activar a sua conta, clique no botão abaixo:</p>
      <a href="${linkActivacao}" class="btn">Confirmar Email</a>
      <p>Este link expira em <strong>24 horas</strong>.</p>
      <p>Se não criou uma conta, ignore este email.</p>
    `),
  });
}

export async function enviarRecuperacaoPassword(destinatario, nome, linkRecuperacao) {
  await enviar({
    para: destinatario,
    assunto: 'Recuperação de password — Hayusten Finance',
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>Recebemos um pedido para redefinir a sua password. Clique no botão abaixo:</p>
      <a href="${linkRecuperacao}" class="btn">Redefinir Password</a>
      <p>Este link expira em <strong>1 hora</strong>.</p>
      <p>Se não pediu esta alteração, pode ignorar este email em segurança.</p>
    `),
  });
}

export async function enviarBoasVindasTrial(destinatario, nome) {
  await enviar({
    para: destinatario,
    assunto: 'A sua conta está activa — 14 dias para explorar tudo! 🎉',
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>O seu email foi confirmado e a sua conta está activa. Tem <strong>14 dias de período experimental</strong> para explorar todas as funcionalidades do Hayusten Finance.</p>
      <div class="destaque">
        <p><strong>O que pode fazer durante o trial:</strong></p>
        <p>✅ Gerir contas bancárias e carteiras<br>
           ✅ Registar receitas e despesas<br>
           ✅ Criar metas de poupança<br>
           ✅ Obter insights e análises de IA<br>
           ✅ Exportar relatórios em PDF e Excel</p>
      </div>
      <a href="${BASE_URL}/dashboard" class="btn">Ir para o Dashboard</a>
    `),
  });
}

export async function enviarAvisoTrialExpira3Dias(destinatario, nome, diasRestantes) {
  await enviar({
    para: destinatario,
    assunto: `O seu trial expira em ${diasRestantes} dias — Hayusten Finance`,
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>O seu período experimental termina em <strong>${diasRestantes} dias</strong>.</p>
      <p>Para continuar a usar o Hayusten Finance sem interrupções, subscreva o plano Premium.</p>
      <a href="${BASE_URL}/assinatura" class="btn">Ver Planos e Preços</a>
      <p>Se tiver dúvidas, responda a este email.</p>
    `),
  });
}

export async function enviarAvisoTrialExpira1Dia(destinatario, nome) {
  await enviar({
    para: destinatario,
    assunto: 'Último dia do seu trial — Hayusten Finance',
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>O seu período experimental <strong>termina amanhã</strong>.</p>
      <p>Não perca acesso às suas finanças. Subscreva agora para continuar sem interrupções:</p>
      <a href="${BASE_URL}/assinatura" class="btn">Subscrever Agora</a>
    `),
  });
}

export async function enviarTrialExpirado(destinatario, nome) {
  await enviar({
    para: destinatario,
    assunto: 'O seu trial expirou — Hayusten Finance',
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>O seu período experimental terminou. A sua conta encontra-se actualmente suspensa.</p>
      <p>Para reactivar o acesso completo aos seus dados financeiros, subscreva o plano Premium:</p>
      <a href="${BASE_URL}/assinatura" class="btn">Reactivar Conta</a>
      <p>Os seus dados estão seguros e serão recuperados assim que subscrever.</p>
    `),
  });
}

export async function enviarPagamentoConfirmado(destinatario, nome, valor, proximaRenovacao) {
  await enviar({
    para: destinatario,
    assunto: 'Pagamento confirmado — Hayusten Finance',
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>O seu pagamento foi confirmado com sucesso.</p>
      <div class="destaque">
        <p><strong>Valor pago:</strong> ${valor}</p>
        <p><strong>Próxima renovação:</strong> ${proximaRenovacao}</p>
      </div>
      <p>Obrigado por confiar no Hayusten Finance para gerir as suas finanças.</p>
      <a href="${BASE_URL}/dashboard" class="btn">Ir para o Dashboard</a>
    `),
  });
}

export async function enviarPagamentoFalhado(destinatario, nome) {
  await enviar({
    para: destinatario,
    assunto: 'Problema com o seu pagamento — Hayusten Finance',
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>Não foi possível processar o seu pagamento mais recente.</p>
      <p>Para evitar a suspensão da sua conta, actualize os seus dados de pagamento:</p>
      <a href="${BASE_URL}/assinatura/pagamento" class="btn">Actualizar Pagamento</a>
      <p>Se o problema persistir, contacte o seu banco ou escolha outro método de pagamento.</p>
    `),
  });
}

export async function enviarAvisoRenovacao(destinatario, nome, valor, dataRenovacao) {
  await enviar({
    para: destinatario,
    assunto: 'Lembrete de renovação — Hayusten Finance',
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>A sua assinatura será renovada em breve.</p>
      <div class="destaque">
        <p><strong>Valor a cobrar:</strong> ${valor}</p>
        <p><strong>Data de renovação:</strong> ${dataRenovacao}</p>
      </div>
      <p>Não é necessária qualquer acção — a renovação é automática.</p>
      <p>Para gerir a sua assinatura: <a href="${BASE_URL}/assinatura">clique aqui</a>.</p>
    `),
  });
}

export async function enviarAssinaturaCancelada(destinatario, nome, dataFimAcesso) {
  await enviar({
    para: destinatario,
    assunto: 'Assinatura cancelada — Hayusten Finance',
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>A sua assinatura foi cancelada conforme solicitado.</p>
      <div class="destaque">
        <p>Continuará a ter acesso completo até <strong>${dataFimAcesso}</strong>.</p>
      </div>
      <p>Esperamos vê-lo de regresso. Para reactivar a qualquer momento:</p>
      <a href="${BASE_URL}/assinatura" class="btn">Reactivar Assinatura</a>
    `),
  });
}

export async function enviarContaSuspensa(destinatario, nome) {
  await enviar({
    para: destinatario,
    assunto: 'Conta suspensa — Hayusten Finance',
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>A sua conta foi suspensa por falta de pagamento.</p>
      <p>Os seus dados estão seguros. Para repor o acesso:</p>
      <a href="${BASE_URL}/assinatura" class="btn">Regularizar Conta</a>
      <p>Se acredita que isto é um erro, responda a este email.</p>
    `),
  });
}

export async function enviarUpgradePlano(destinatario, nome, novoPlano) {
  await enviar({
    para: destinatario,
    assunto: `Plano actualizado para ${novoPlano} — Hayusten Finance`,
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>O seu plano foi actualizado para <strong>${novoPlano}</strong> com sucesso!</p>
      <p>Já tem acesso a todas as funcionalidades do novo plano.</p>
      <a href="${BASE_URL}/dashboard" class="btn">Explorar Novidades</a>
    `),
  });
}

export async function enviarDowngradePlano(destinatario, nome, novoPlano) {
  await enviar({
    para: destinatario,
    assunto: `Alteração de plano — Hayusten Finance`,
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>O seu plano foi alterado para <strong>${novoPlano}</strong>.</p>
      <p>A alteração entrará em vigor no próximo ciclo de facturação.</p>
      <a href="${BASE_URL}/assinatura" class="btn">Ver Detalhes da Assinatura</a>
    `),
  });
}

export async function enviarRelatorioMensal(destinatario, nome, dadosRelatorio, plano) {
  const { mes, ano, totalReceitas, totalDespesas, poupanca, topCategorias } = dadosRelatorio;
  const linhasCategorias = (topCategorias || [])
    .map((c) => `<p>• ${c.nome}: <strong>${c.valor}</strong></p>`)
    .join('');

  await enviar({
    para: destinatario,
    assunto: `Relatório de ${mes}/${ano} — Hayusten Finance`,
    html: moldura(`
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>O seu relatório financeiro de <strong>${mes}/${ano}</strong> está pronto.</p>
      <div class="destaque">
        <p><strong>Resumo do mês:</strong></p>
        <p>📈 Receitas: <strong>${totalReceitas}</strong></p>
        <p>📉 Despesas: <strong>${totalDespesas}</strong></p>
        <p>💰 Poupança: <strong>${poupanca}</strong></p>
      </div>
      ${linhasCategorias ? `<p><strong>Top categorias de despesa:</strong></p>${linhasCategorias}` : ''}
      <a href="${BASE_URL}/relatorios" class="btn">Ver Relatório Completo</a>
      ${plano === 'premium' ? '<p><em>O relatório em PDF foi exportado e está disponível na plataforma.</em></p>' : ''}
    `),
  });
}
