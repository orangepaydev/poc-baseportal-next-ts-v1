import 'server-only';

import { sendEmail } from '@/lib/email';

type OrganizationAdminAccountEmailInput = {
  organizationCode: string;
  organizationName: string;
  username: string;
  email: string;
  password: string;
};

export function buildOrganizationAdminAccountCreatedEmail(
  input: OrganizationAdminAccountEmailInput
) {
  return {
    subject: `Your ${input.organizationName} account is ready`,
    text: `Dear ${input.username}

Your account for ${input.organizationCode} was created and please login using:

${input.username} / ${input.password}

Regards,

Admin`,
  };
}

export async function sendOrganizationAdminAccountCreatedEmail(
  input: OrganizationAdminAccountEmailInput
) {
  const message = buildOrganizationAdminAccountCreatedEmail(input);

  return sendEmail({
    to: input.email,
    subject: message.subject,
    text: message.text,
  });
}