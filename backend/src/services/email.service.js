const nodemailer = require('nodemailer')

let transporter

function createError(message, statusCode, code) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  return error
}

function getTransporter() {
  const user = process.env.GMAIL_USER?.trim()
  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '')
  if (!user || !password) {
    throw createError('Email delivery is not configured.', 503, 'EMAIL_NOT_CONFIGURED')
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass: password },
    })
  }

  return { client: transporter, user }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sendOtpEmail({ to, subject, code, action, name }) {
  const { client, user } = getTransporter()
  const senderAddress = process.env.EMAIL_FROM?.trim() || user
  const recipientName = name?.trim() || 'there'
  const safeName = escapeHtml(recipientName)
  const safeAction = escapeHtml(action)
  const safeSubject = escapeHtml(subject)
  const expiresInMinutes = 5
  const codeDigits = String(code).split('').map((digit) => (
    `<td style="width:42px;height:58px;text-align:center;vertical-align:middle;background:#f0fafa;border:1px solid #d5e9e9;border-radius:10px;color:#087f83;font-family:Arial,sans-serif;font-size:30px;font-weight:700">${digit}</td><td style="width:7px"></td>`
  )).join('')

  try {
    await client.sendMail({
      from: { name: 'Nirogix X', address: senderAddress },
      to,
      subject,
      text: `NIROGIX X\nSecure healthcare access\n\nYour verification code\n\nHello ${recipientName},\n\n${action}\n\n${code}\n\nThis code expires in ${expiresInMinutes} minutes.\n\nIf you did not request this code, you can safely ignore this email. Never share this code with anyone.`,
      html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f7;font-family:Arial,Helvetica,sans-serif;color:#142936">
    <div style="display:none;font-size:1px;color:#f1f5f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Your Nirogix X verification code expires in 5 minutes.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f7">
      <tr>
        <td align="center" style="padding:32px 12px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;background-color:#ffffff;border:1px solid #dfe7ea;border-radius:18px;overflow:hidden">
            <tr>
              <td style="height:5px;background-color:#0b8588;font-size:0;line-height:0">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:32px 28px 34px">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width:38px;height:38px;border-radius:12px;background-color:#e5f5f4;color:#087f83;text-align:center;vertical-align:middle;font-size:19px;font-weight:700">N</td>
                    <td style="padding-left:11px;color:#087f83;font-size:18px;font-weight:800;letter-spacing:1.5px">NIROGIX X</td>
                  </tr>
                </table>
                <p style="margin:30px 0 10px;color:#087f83;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">Secure account verification</p>
                <h1 style="margin:0 0 18px;color:#142936;font-size:32px;line-height:1.2;font-weight:700">Your verification code</h1>
                <p style="margin:0 0 10px;color:#52636d;font-size:17px;line-height:1.6">Hello ${safeName},</p>
                <p style="margin:0 0 24px;color:#66737d;font-size:16px;line-height:1.65">${safeAction}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;background-color:#f7fbfb;border:1px solid #dfebeb;border-radius:14px">
                  <tr>
                    <td align="center" style="padding:18px 8px">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>${codeDigits}</tr></table>
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px">
                  <tr>
                    <td style="padding:7px 11px;border-radius:20px;background-color:#fff5df;color:#875b08;font-size:12px;font-weight:700">EXPIRES IN 5 MINUTES</td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr><td style="height:1px;background-color:#e8edef;font-size:0;line-height:0">&nbsp;</td></tr>
                </table>
                <p style="margin:20px 0 0;color:#74818a;font-size:13px;line-height:1.7">If you did not request this code, you can safely ignore this email. For your security, never share this code with anyone.</p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;color:#87939a;font-size:12px;line-height:1.6">Nirogix X · Secure healthcare access<br>This is an automated message. Please do not reply.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    })
  } catch (cause) {
    const error = createError('Email delivery failed. Please try again later.', 503, 'EMAIL_DELIVERY_FAILED')
    error.cause = cause
    throw error
  }
}

module.exports = { sendOtpEmail }
