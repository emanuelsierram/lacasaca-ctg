import { Resend } from 'resend';

function getRequiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const passwordResetService = {
  async sendResetEmail(email: string, token: string) {
    const resend = new Resend(getRequiredEnvironment('RESEND_API_KEY'));
    const from = getRequiredEnvironment('RESEND_FROM_EMAIL');
    const frontendUrl = getRequiredEnvironment('FRONTEND_URL').replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/?resetToken=${encodeURIComponent(token)}`;

    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: 'Restablece tu contraseña en La Casaca',
      text: `Hola,\n\nRecibimos una solicitud para restablecer la contraseña de tu cuenta en La Casaca.\n\nRestablece tu contraseña aquí: ${resetUrl}\n\nEste enlace vence en 30 minutos y solo puede utilizarse una vez. Si no solicitaste este cambio, puedes ignorar este correo.`,
      html: `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f4f6f8;color:#0c1715;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Restablece tu contraseña de La Casaca de forma segura.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#111827;padding:28px 32px;color:#ffffff;">
                <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#d9a441;">La Casaca</div>
                <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-weight:700;">Restablece tu contraseña</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola,</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#475569;">Recibimos una solicitud para crear una nueva contraseña para tu cuenta. Usa el botón siguiente para continuar.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="border-radius:8px;background:#d9a441;">
                      <a href="${resetUrl}" style="display:inline-block;padding:14px 22px;border-radius:8px;color:#000000;font-size:15px;font-weight:700;text-decoration:none;">Restablecer contraseña</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#64748b;">Este enlace vence en 30 minutos y solo puede utilizarse una vez.</p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                <hr style="margin:28px 0;border:0;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <p style="margin:8px 0 0;word-break:break-all;font-size:12px;line-height:1.6;color:#64748b;">${resetUrl}</p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">La Casaca · Este mensaje fue enviado automáticamente</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
    });

    if (error) {
      throw new Error(`Password reset email failed: ${error.message}`);
    }
  }
};