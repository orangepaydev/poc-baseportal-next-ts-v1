import 'server-only';

import {
  createTransport,
  type SendMailOptions,
  type SentMessageInfo,
} from 'nodemailer';

type EmailAddress = {
  address: string;
  name?: string;
};

type EmailConfig = {
  from: EmailAddress;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user?: string;
    password?: string;
    tlsRejectUnauthorized?: boolean;
  };
};

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
};

type GlobalEmailState = typeof globalThis & {
  __emailConfigLogKey?: string;
  __emailTransporter?: ReturnType<typeof createTransport>;
};

function parseOptionalBoolean(value: string | undefined, fieldName: string) {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw new Error(`Invalid boolean value "${normalized}" for ${fieldName}.`);
}

function parseOptionalNumber(value: string | undefined, fieldName: string) {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric value "${normalized}" for ${fieldName}.`);
  }

  return parsed;
}

function buildFromAddress(from: EmailAddress) {
  return from.name ? `${from.name} <${from.address}>` : from.address;
}

function loadEmailConfig(
  env: NodeJS.ProcessEnv = process.env
): EmailConfig | null {
  const host = env.EMAIL_SMTP_HOST?.trim();

  if (!host) {
    return null;
  }

  const port =
    parseOptionalNumber(env.EMAIL_SMTP_PORT, 'EMAIL_SMTP_PORT') ?? 25;
  const secure =
    parseOptionalBoolean(env.EMAIL_SMTP_SECURE, 'EMAIL_SMTP_SECURE') ?? false;
  const user = env.EMAIL_SMTP_USER?.trim() || undefined;
  const password = env.EMAIL_SMTP_PASSWORD?.trim() || undefined;
  const tlsRejectUnauthorized = parseOptionalBoolean(
    env.EMAIL_SMTP_TLS_REJECT_UNAUTHORIZED,
    'EMAIL_SMTP_TLS_REJECT_UNAUTHORIZED'
  );
  const fromAddress = env.EMAIL_FROM_ADDRESS?.trim() || 'no-reply@localhost';
  const fromName = env.EMAIL_FROM_NAME?.trim() || undefined;

  if (password && !user) {
    throw new Error(
      'EMAIL_SMTP_PASSWORD requires EMAIL_SMTP_USER to also be set.'
    );
  }

  return {
    from: {
      address: fromAddress,
      name: fromName,
    },
    smtp: {
      host,
      port,
      secure,
      user,
      password,
      tlsRejectUnauthorized,
    },
  };
}

function logEmailConfigured(config: EmailConfig) {
  const globalEmailState = globalThis as GlobalEmailState;
  const authMode = config.smtp.user ? 'auth' : 'open';
  const tlsMode = config.smtp.secure ? 'ssl' : 'plain';
  const logKey = [
    config.smtp.host,
    config.smtp.port,
    tlsMode,
    authMode,
    config.smtp.tlsRejectUnauthorized,
    config.from.address,
  ].join('|');

  if (globalEmailState.__emailConfigLogKey === logKey) {
    return;
  }

  globalEmailState.__emailConfigLogKey = logKey;

  console.info(
    `[email] SMTP configured. host=${config.smtp.host}; port=${config.smtp.port}; secure=${config.smtp.secure}; auth=${config.smtp.user ? 'enabled' : 'disabled'}`
  );
}

function getTransporter() {
  const config = loadEmailConfig();

  if (!config) {
    throw new Error(
      'Email is not configured. Populate EMAIL_SMTP_HOST in .env using .env.example before sending mail.'
    );
  }

  logEmailConfigured(config);

  const globalEmailState = globalThis as GlobalEmailState;

  if (!globalEmailState.__emailTransporter) {
    globalEmailState.__emailTransporter = createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user
        ? {
            user: config.smtp.user,
            pass: config.smtp.password ?? '',
          }
        : undefined,
      tls:
        config.smtp.tlsRejectUnauthorized === undefined
          ? undefined
          : {
              rejectUnauthorized: config.smtp.tlsRejectUnauthorized,
            },
    });
  }

  return {
    config,
    transporter: globalEmailState.__emailTransporter,
  };
}

export function isEmailConfigured(env: NodeJS.ProcessEnv = process.env) {
  return loadEmailConfig(env) !== null;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  from,
  replyTo,
  cc,
  bcc,
}: SendEmailInput): Promise<SentMessageInfo> {
  if (!text && !html) {
    throw new Error('Email body must include text or html content.');
  }

  const { config, transporter } = getTransporter();

  const message: SendMailOptions = {
    from: from ?? buildFromAddress(config.from),
    to,
    cc,
    bcc,
    replyTo,
    subject,
    text,
    html,
  };

  return transporter.sendMail(message);
}

export type { EmailConfig, EmailAddress };
