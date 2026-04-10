import 'server-only';

import { sendEmail } from '@/lib/email';

type UserAccountEmailInput = {
  organizationCode: string;
  organizationName: string;
  username: string;
  email: string;
  password: string;
};

export function buildUserAccountCreatedEmail(input: UserAccountEmailInput) {
  return {
    subject: `Your ${input.organizationName} account is ready`,
    text: `Dear ${input.username}

Your account for ${input.organizationCode} was created and approved. Please login using:

${input.username} / ${input.password}

Regards,

Admin`,
  };
}

export async function sendUserAccountCreatedEmail(
  input: UserAccountEmailInput
) {
  const message = buildUserAccountCreatedEmail(input);

  return sendEmail({
    to: input.email,
    subject: message.subject,
    text: message.text,
  });
}