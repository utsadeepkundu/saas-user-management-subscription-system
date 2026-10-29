export const isEmailDeliveryConfigured = () => Boolean(
  process.env.RESEND_API_KEY && process.env.EMAIL_FROM
);

export const sendPasswordResetEmail = async ({ email, resetUrl }) => {
  if (!isEmailDeliveryConfigured()) {
    throw new Error('Password reset email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: 'Reset your SaaSFlow password',
      text: `Use this single-use link to reset your SaaSFlow password. It expires in 30 minutes: ${resetUrl}`,
      html: `<p>We received a request to reset your SaaSFlow password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This single-use link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    console.error('Password reset email provider error:', response.status, details.slice(0, 300));
    throw new Error('Password reset email could not be sent.');
  }
};
