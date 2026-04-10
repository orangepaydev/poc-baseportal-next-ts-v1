import 'server-only';

import { sendEmail } from '@/lib/email';

type UserPasswordResetEmailInput = {
  organizationCode: string;
  organizationName: string;
  username: string;
  email: string;
  password: string;
};

export function buildUserPasswordResetEmail(
  input: UserPasswordResetEmailInput
) {
  return {
    subject: `Your ${input.organizationName} password was reset`,
    text: `Dear ${input.username}

Your password for ${input.organizationCode} was reset and approved. Please login using:

${input.username} / ${input.password}

Regards,

Admin`,
  };
}

export async function sendUserPasswordResetEmail(
  input: UserPasswordResetEmailInput
) {
  const message = buildUserPasswordResetEmail(input);

  return sendEmail({
    to: input.email,
    subject: message.subject,
    text: message.text,
  });
}