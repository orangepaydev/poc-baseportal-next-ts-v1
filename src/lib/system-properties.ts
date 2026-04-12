import 'server-only';

import { db } from '@/lib/db';
import { getAuthenticatedUserContext } from '@/lib/auth/authorization';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type SystemPropertyRequestAction = 'CREATE' | 'ADD' | 'UPDATE' | 'REMOVE';

type SystemPropertyListRow = {
  id: number | string;
  property_code: string;
  description: string;
  value_count: number | string;
  updated_at: Date | string;
};

type ExistingSystemPropertyRow = SystemPropertyListRow;

type ExistingSystemPropertyValueRow = {
  id: number | string;
  system_property_id: number | string;
  property_item_code: string;
  property_value: string;
  description: string;
  updated_at: Date | string;
};

type ApprovalRequestRow = {
  id: number | string;
  resource_key: string;
  action_type: SystemPropertyRequestAction;
  status: ApprovalStatus;
  summary: string;
  submitted_by_user_id: number | string | null;
  submitted_by_display_name: string | null;
  submitted_at: Date | string;
};

type SystemPropertySnapshot = {
  id?: number;
  property_code: string;
  description: string;
};

type SystemPropertyValueSnapshot = {
  id?: number;
  system_property_id?: number;
  property_code?: string;
  property_item_code: string;
  property_value: string;
  description: string;
};

type SystemPropertyChangedField = {
  before: unknown;
  after: unknown;
};

type SystemPropertyChangedFields = Record<string, SystemPropertyChangedField>;

type CreateSystemPropertyPatch = {
  op: 'CREATE_SYSTEM_PROPERTY';
  values: {
    property_code: string;
    description: string;
  };
};

type CreateSystemPropertyValuePatch = {
  op: 'CREATE_SYSTEM_PROPERTY_VALUE';
  target: {
    system_property_id: number;
  };
  values: {
    property_item_code: string;
    property_value: string;
    description: string;
  };
};

type UpdateSystemPropertyValuePatch = {
  op: 'UPDATE_SYSTEM_PROPERTY_VALUE';
  target: {
    id: number;
    system_property_id: number;
  };
  values: {
    property_item_code: string;
    property_value: string;
    description: string;
  };
};

type DeleteSystemPropertyValuePatch = {
  op: 'DELETE_SYSTEM_PROPERTY_VALUE';
  target: {
    id: number;
    system_property_id: number;
  };
};

export type SystemPropertyChangePatch =
  | CreateSystemPropertyPatch
  | CreateSystemPropertyValuePatch
  | UpdateSystemPropertyValuePatch
  | DeleteSystemPropertyValuePatch;

export type ManagedSystemProperty = {
  id: number;
  propertyCode: string;
  description: string;
  valueCount: number;
  updatedAt: string;
};

export type ManagedSystemPropertyValue = {
  id: number;
  systemPropertyId: number;
  propertyItemCode: string;
  propertyValue: string;
  description: string;
  updatedAt: string;
};

export type ManagedSystemPropertyDetail = ManagedSystemProperty & {
  values: ManagedSystemPropertyValue[];
};

export type PaginatedSystemPropertySearchResult = {
  rows: ManagedSystemProperty[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type PendingSystemPropertyRequest = {
  id: number;
  resourceKey: string;
  actionType: SystemPropertyRequestAction;
  summary: string;
  submittedByUserId: number | null;
  submittedByDisplayName: string | null;
  submittedAt: string;
};

const SYSTEM_PROPERTY_RESOURCE_TYPE = 'SYSTEM_PROPERTY';
const OWNER_ORGANIZATION_CODE = 'owner';
const SYSTEM_PROPERTY_FIELDS = ['property_code', 'description'] as const;
const SYSTEM_PROPERTY_VALUE_FIELDS = [
  'property_item_code',
  'property_value',
  'description',
] as const;

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function toIsoString(value: Date | string) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function requirePositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} is invalid.`);
  }
}

function validatePropertyCode(propertyCode: string) {
  const normalized = propertyCode.trim();

  if (!/^[A-Za-z0-9_-]{2,100}$/.test(normalized)) {
    throw new Error(
      'System Property code must be 2 to 100 characters and use only letters, numbers, hyphens, or underscores.'
    );
  }

  return normalized;
}

function validatePropertyItemCode(propertyItemCode: string) {
  const normalized = propertyItemCode.trim();

  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(normalized)) {
    throw new Error(
      'System Property Value code must be 1 to 100 characters and use only letters, numbers, periods, hyphens, or underscores.'
    );
  }

  return normalized;
}

function validateDescription(description: string, label = 'Description') {
  const normalized = description.trim();

  if (normalized.length < 2 || normalized.length > 200) {
    throw new Error(`${label} must be between 2 and 200 characters.`);
  }

  return normalized;
}

function validatePropertyValue(propertyValue: string) {
  const normalized = propertyValue.trim();

  if (normalized.length < 1 || normalized.length > 255) {
    throw new Error(
      'System Property Value must be between 1 and 255 characters.'
    );
  }

  return normalized;
}

function buildSystemPropertyResourceKey(propertyCode: string) {
  return `SYSTEM_PROPERTY:${propertyCode}`;
}

function buildSystemPropertyValueCreateResourceKey(
  propertyCode: string,
  propertyItemCode: string
) {
  return `SYSTEM_PROPERTY:${propertyCode}:VALUE:${propertyItemCode}`;
}

function buildSystemPropertyValueExistingResourceKey(
  propertyCode: string,
  valueId: number
) {
  return `SYSTEM_PROPERTY:${propertyCode}:VALUE_ID:${valueId}`;
}

function mapManagedSystemProperty(
  row: SystemPropertyListRow
): ManagedSystemProperty {
  return {
    id: toNumber(row.id),
    propertyCode: row.property_code,
    description: row.description,
    valueCount: toNumber(row.value_count),
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapManagedSystemPropertyValue(
  row: ExistingSystemPropertyValueRow
): ManagedSystemPropertyValue {
  return {
    id: toNumber(row.id),
    systemPropertyId: toNumber(row.system_property_id),
    propertyItemCode: row.property_item_code,
    propertyValue: row.property_value,
    description: row.description,
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapPendingSystemPropertyRequest(
  row: ApprovalRequestRow
): PendingSystemPropertyRequest {
  return {
    id: toNumber(row.id),
    resourceKey: row.resource_key,
    actionType: row.action_type,
    summary: row.summary,
    submittedByUserId:
      row.submitted_by_user_id === null
        ? null
        : toNumber(row.submitted_by_user_id),
    submittedByDisplayName: row.submitted_by_display_name,
    submittedAt: toIsoString(row.submitted_at),
  };
}

function buildSystemPropertySnapshot(input: {
  id?: number;
  propertyCode: string;
  description: string;
}): SystemPropertySnapshot {
  return {
    ...(input.id ? { id: input.id } : {}),
    property_code: input.propertyCode,
    description: input.description,
  };
}

function buildSystemPropertyValueSnapshot(input: {
  id?: number;
  systemPropertyId?: number;
  propertyCode: string;
  propertyItemCode: string;
  propertyValue: string;
  description: string;
}): SystemPropertyValueSnapshot {
  return {
    ...(input.id ? { id: input.id } : {}),
    ...(input.systemPropertyId ? { system_property_id: input.systemPropertyId } : {}),
    property_code: input.propertyCode,
    property_item_code: input.propertyItemCode,
    property_value: input.propertyValue,
    description: input.description,
  };
}

function buildChangedFields(
  fields: readonly string[],
  beforeState: Record<string, unknown> | null,
  afterState: Record<string, unknown> | null
) {
  const changedFields: SystemPropertyChangedFields = {};

  for (const field of fields) {
    const beforeValue = beforeState?.[field] ?? null;
    const afterValue = afterState?.[field] ?? null;

    if (beforeValue === afterValue) {
      continue;
    }

    changedFields[field] = {
      before: beforeValue,
      after: afterValue,
    };
  }

  return Object.keys(changedFields).length > 0 ? changedFields : null;
}

async function requirePermission(permissionCode: string) {
  const context = await getAuthenticatedUserContext();

  if (context.session.organizationCode !== OWNER_ORGANIZATION_CODE) {
    throw new Error(
      'Only users in the Owner organization can access System Property management.'
    );
  }

  if (
    context.session.userType !== 'ADMIN' &&
    !context.permissionCodes.includes(permissionCode)
  ) {
    throw new Error('You do not have permission to perform this action.');
  }

  return context;
}

async function ensureNoPendingLock(resourceKey: string) {
  const existingLock = await db.queryOne<{ approval_request_id: number | string }>(
    `
      select
        approval_request_id
      from approval_locks
      where resource_type = ?
        and resource_key = ?
    `,
    [SYSTEM_PROPERTY_RESOURCE_TYPE, resourceKey]
  );

  if (existingLock) {
    throw new Error(
      'A pending System Property request already exists for this resource.'
    );
  }
}

async function findSystemPropertyById(systemPropertyId: number) {
  return db.queryOne<ExistingSystemPropertyRow>(
    `
      select
        sp.id,
        sp.property_code,
        sp.description,
        count(distinct spc.id) as value_count,
        CONCAT(DATE_FORMAT(sp.updated_at, '%Y-%m-%dT%T.000'), 'Z') AS updated_at
      from system_properties sp
      left join system_property_codes spc
        on spc.system_property_id = sp.id
      where sp.id = ?
      group by
        sp.id,
        sp.property_code,
        sp.description,
        sp.updated_at
    `,
    [systemPropertyId]
  );
}

async function findSystemPropertyByCode(propertyCode: string) {
  return db.queryOne<{ id: number | string }>(
    `
      select
        id
      from system_properties
      where property_code = ?
    `,
    [propertyCode]
  );
}

async function findSystemPropertyValues(systemPropertyId: number) {
  return db.query<ExistingSystemPropertyValueRow>(
    `
      select
        spc.id,
        spc.system_property_id,
        spc.property_item_code,
        spc.property_value,
        spc.description,
        CONCAT(DATE_FORMAT(spc.updated_at, '%Y-%m-%dT%T.000'), 'Z') AS updated_at
      from system_property_codes spc
      where spc.system_property_id = ?
      order by spc.property_item_code asc, spc.id desc
    `,
    [systemPropertyId]
  );
}

async function findSystemPropertyValueById(
  systemPropertyId: number,
  valueId: number
) {
  return db.queryOne<ExistingSystemPropertyValueRow>(
    `
      select
        spc.id,
        spc.system_property_id,
        spc.property_item_code,
        spc.property_value,
        spc.description,
        CONCAT(DATE_FORMAT(spc.updated_at, '%Y-%m-%dT%T.000'), 'Z') AS updated_at
      from system_property_codes spc
      where spc.system_property_id = ?
        and spc.id = ?
    `,
    [systemPropertyId, valueId]
  );
}

async function findSystemPropertyValueByCode(
  systemPropertyId: number,
  propertyItemCode: string
) {
  return db.queryOne<{ id: number | string }>(
    `
      select
        id
      from system_property_codes
      where system_property_id = ?
        and property_item_code = ?
    `,
    [systemPropertyId, propertyItemCode]
  );
}

async function recordApprovalSubmission(input: {
  organizationId: number;
  actorUserId: number;
  approvalRequestId: number;
  resourceKey: string;
  actionType: SystemPropertyRequestAction;
  summary: string;
}) {
  await db.execute(
    `
      insert into approval_request_actions (
        approval_request_id,
        action_type,
        acted_by_user_id,
        comment_text,
        state_snapshot
      )
      values (?, 'SUBMITTED', ?, null, ?)
    `,
    [
      input.approvalRequestId,
      input.actorUserId,
      JSON.stringify({
        action_type: input.actionType,
        resource_key: input.resourceKey,
      }),
    ]
  );

  await db.execute(
    `
      insert into audit_events (
        organization_id,
        actor_user_id,
        event_type,
        resource_type,
        resource_key,
        approval_request_id,
        event_data
      )
      values (?, ?, 'SYSTEM_PROPERTY_CHANGE_SUBMITTED', ?, ?, ?, ?)
    `,
    [
      input.organizationId,
      input.actorUserId,
      SYSTEM_PROPERTY_RESOURCE_TYPE,
      input.resourceKey,
      input.approvalRequestId,
      JSON.stringify({ action_type: input.actionType, summary: input.summary }),
    ]
  );
}

async function createApprovalRequest(input: {
  organizationId: number;
  actorUserId: number;
  resourceKey: string;
  actionType: SystemPropertyRequestAction;
  summary: string;
  beforeState: SystemPropertySnapshot | SystemPropertyValueSnapshot | null;
  afterState: SystemPropertySnapshot | SystemPropertyValueSnapshot | null;
  changedFields: SystemPropertyChangedFields | null;
  changePatch: SystemPropertyChangePatch;
}) {
  const result = await db.execute(
    `
      insert into approval_requests (
        organization_id,
        resource_type,
        resource_key,
        action_type,
        summary,
        before_state,
        after_state,
        changed_fields,
        change_patch,
        submitted_by_user_id
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.organizationId,
      SYSTEM_PROPERTY_RESOURCE_TYPE,
      input.resourceKey,
      input.actionType,
      input.summary,
      input.beforeState ? JSON.stringify(input.beforeState) : null,
      input.afterState ? JSON.stringify(input.afterState) : null,
      input.changedFields ? JSON.stringify(input.changedFields) : null,
      JSON.stringify(input.changePatch),
      input.actorUserId,
    ]
  );

  const approvalRequestId = toNumber(result.insertId);

  requirePositiveInteger(approvalRequestId, 'Approval request');

  try {
    await db.execute(
      `
        insert into approval_locks (
          resource_type,
          resource_key,
          approval_request_id
        )
        values (?, ?, ?)
      `,
      [SYSTEM_PROPERTY_RESOURCE_TYPE, input.resourceKey, approvalRequestId]
    );
  } catch (error) {
    await db.execute('delete from approval_requests where id = ?', [
      approvalRequestId,
    ]);
    throw error;
  }

  await recordApprovalSubmission({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    approvalRequestId,
    resourceKey: input.resourceKey,
    actionType: input.actionType,
    summary: input.summary,
  });
}

export async function searchApprovedSystemPropertiesPage(input: {
  propertyQuery?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedSystemPropertySearchResult> {
  await requirePermission('SYSTEM_PROPERTY_READ');

  const searchQuery = (input.propertyQuery ?? '').trim();
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 10, 100));
  const page = Math.max(1, input.page ?? 1);
  const offset = (page - 1) * pageSize;

  const totalRow = await db.queryOne<{ total_count: number | string }>(
    `
      select
        count(*) as total_count
      from system_properties sp
      where (? = ''
        or sp.property_code like concat('%', ?, '%')
        or sp.description like concat('%', ?, '%'))
    `,
    [searchQuery, searchQuery, searchQuery]
  );

  const rows = await db.query<SystemPropertyListRow>(
    `
      select
        sp.id,
        sp.property_code,
        sp.description,
        count(distinct spc.id) as value_count,
        CONCAT(DATE_FORMAT(sp.updated_at, '%Y-%m-%dT%T.000'), 'Z') AS updated_at
      from system_properties sp
      left join system_property_codes spc
        on spc.system_property_id = sp.id
      where (? = ''
        or sp.property_code like concat('%', ?, '%')
        or sp.description like concat('%', ?, '%'))
      group by
        sp.id,
        sp.property_code,
        sp.description,
        sp.updated_at
      order by sp.property_code asc, sp.id desc
      limit ? offset ?
    `,
    [searchQuery, searchQuery, searchQuery, pageSize, offset]
  );

  return {
    rows: rows.map(mapManagedSystemProperty),
    totalCount: toNumber(totalRow?.total_count),
    page,
    pageSize,
  };
}

export async function getApprovedSystemPropertyById(
  systemPropertyId: number
): Promise<ManagedSystemPropertyDetail | null> {
  await requirePermission('SYSTEM_PROPERTY_READ');

  const systemProperty = await findSystemPropertyById(systemPropertyId);

  if (!systemProperty) {
    return null;
  }

  const values = await findSystemPropertyValues(systemPropertyId);

  return {
    ...mapManagedSystemProperty(systemProperty),
    values: values.map(mapManagedSystemPropertyValue),
  };
}

export async function getApprovedSystemPropertyValueById(
  systemPropertyId: number,
  valueId: number
): Promise<ManagedSystemPropertyValue | null> {
  await requirePermission('SYSTEM_PROPERTY_READ');

  const value = await findSystemPropertyValueById(systemPropertyId, valueId);

  return value ? mapManagedSystemPropertyValue(value) : null;
}

export async function listPendingSystemPropertyRequests() {
  const context = await requirePermission('SYSTEM_PROPERTY_READ');
  const rows = await db.query<ApprovalRequestRow>(
    `
      select
        ar.id,
        ar.resource_key,
        ar.action_type,
        ar.status,
        ar.summary,
        ar.submitted_by_user_id,
        submitter.display_name as submitted_by_display_name,
        ar.submitted_at
      from approval_requests ar
      left join users submitter
        on submitter.id = ar.submitted_by_user_id
      where ar.organization_id = ?
        and ar.resource_type = ?
        and ar.status = 'PENDING'
      order by ar.submitted_at desc, ar.id desc
    `,
    [context.session.organizationId, SYSTEM_PROPERTY_RESOURCE_TYPE]
  );

  return rows.map(mapPendingSystemPropertyRequest);
}

export function buildSystemPropertyRouteResourceKey(propertyCode: string) {
  return buildSystemPropertyResourceKey(propertyCode);
}

export function buildSystemPropertyValueRouteResourceKey(
  propertyCode: string,
  valueId: number
) {
  return buildSystemPropertyValueExistingResourceKey(propertyCode, valueId);
}

export async function submitCreateSystemPropertyRequest(input: {
  propertyCode: string;
  description: string;
}) {
  const context = await requirePermission('SYSTEM_PROPERTY_WRITE');
  const propertyCode = validatePropertyCode(input.propertyCode);
  const description = validateDescription(input.description);
  const resourceKey = buildSystemPropertyResourceKey(propertyCode);

  await ensureNoPendingLock(resourceKey);

  const existingProperty = await findSystemPropertyByCode(propertyCode);

  if (existingProperty) {
    throw new Error('A System Property with this code already exists.');
  }

  const afterState = buildSystemPropertySnapshot({
    propertyCode,
    description,
  });

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'CREATE',
    summary: `Create System Property ${propertyCode}`,
    beforeState: null,
    afterState,
    changedFields: buildChangedFields(
      SYSTEM_PROPERTY_FIELDS,
      null,
      afterState as Record<string, unknown>
    ),
    changePatch: {
      op: 'CREATE_SYSTEM_PROPERTY',
      values: {
        property_code: propertyCode,
        description,
      },
    },
  });
}

export async function submitCreateSystemPropertyValueRequest(input: {
  systemPropertyId: number;
  propertyItemCode: string;
  propertyValue: string;
  description: string;
}) {
  const context = await requirePermission('SYSTEM_PROPERTY_WRITE');
  requirePositiveInteger(input.systemPropertyId, 'System Property');

  const systemProperty = await findSystemPropertyById(input.systemPropertyId);

  if (!systemProperty) {
    throw new Error('System Property was not found.');
  }

  const propertyItemCode = validatePropertyItemCode(input.propertyItemCode);
  const propertyValue = validatePropertyValue(input.propertyValue);
  const description = validateDescription(
    input.description,
    'System Property Value Description'
  );
  const resourceKey = buildSystemPropertyValueCreateResourceKey(
    systemProperty.property_code,
    propertyItemCode
  );

  await ensureNoPendingLock(resourceKey);

  const existingValue = await findSystemPropertyValueByCode(
    input.systemPropertyId,
    propertyItemCode
  );

  if (existingValue) {
    throw new Error(
      'A System Property Value with this code already exists for the selected System Property.'
    );
  }

  const afterState = buildSystemPropertyValueSnapshot({
    systemPropertyId: toNumber(systemProperty.id),
    propertyCode: systemProperty.property_code,
    propertyItemCode,
    propertyValue,
    description,
  });

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'ADD',
    summary: `Add System Property Value ${propertyItemCode} to ${systemProperty.property_code}`,
    beforeState: null,
    afterState,
    changedFields: buildChangedFields(
      SYSTEM_PROPERTY_VALUE_FIELDS,
      null,
      afterState as Record<string, unknown>
    ),
    changePatch: {
      op: 'CREATE_SYSTEM_PROPERTY_VALUE',
      target: {
        system_property_id: toNumber(systemProperty.id),
      },
      values: {
        property_item_code: propertyItemCode,
        property_value: propertyValue,
        description,
      },
    },
  });
}

export async function submitUpdateSystemPropertyValueRequest(input: {
  systemPropertyId: number;
  valueId: number;
  propertyItemCode: string;
  propertyValue: string;
  description: string;
}) {
  const context = await requirePermission('SYSTEM_PROPERTY_WRITE');
  requirePositiveInteger(input.systemPropertyId, 'System Property');
  requirePositiveInteger(input.valueId, 'System Property Value');

  const systemProperty = await findSystemPropertyById(input.systemPropertyId);

  if (!systemProperty) {
    throw new Error('System Property was not found.');
  }

  const existingValueRow = await findSystemPropertyValueById(
    input.systemPropertyId,
    input.valueId
  );

  if (!existingValueRow) {
    throw new Error('System Property Value was not found.');
  }

  const existingValue = mapManagedSystemPropertyValue(existingValueRow);
  const propertyItemCode = validatePropertyItemCode(input.propertyItemCode);
  const propertyValue = validatePropertyValue(input.propertyValue);
  const description = validateDescription(
    input.description,
    'System Property Value Description'
  );
  const resourceKey = buildSystemPropertyValueExistingResourceKey(
    systemProperty.property_code,
    existingValue.id
  );

  await ensureNoPendingLock(resourceKey);

  if (propertyItemCode !== existingValue.propertyItemCode) {
    const conflictingValue = await findSystemPropertyValueByCode(
      input.systemPropertyId,
      propertyItemCode
    );

    if (conflictingValue) {
      throw new Error(
        'A System Property Value with this code already exists for the selected System Property.'
      );
    }
  }

  const beforeState = buildSystemPropertyValueSnapshot({
    id: existingValue.id,
    systemPropertyId: existingValue.systemPropertyId,
    propertyCode: systemProperty.property_code,
    propertyItemCode: existingValue.propertyItemCode,
    propertyValue: existingValue.propertyValue,
    description: existingValue.description,
  });
  const afterState = buildSystemPropertyValueSnapshot({
    id: existingValue.id,
    systemPropertyId: existingValue.systemPropertyId,
    propertyCode: systemProperty.property_code,
    propertyItemCode,
    propertyValue,
    description,
  });
  const changedFields = buildChangedFields(
    SYSTEM_PROPERTY_VALUE_FIELDS,
    beforeState as Record<string, unknown>,
    afterState as Record<string, unknown>
  );

  if (!changedFields) {
    throw new Error('No System Property Value changes were provided.');
  }

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'UPDATE',
    summary: `Update System Property Value ${existingValue.propertyItemCode} in ${systemProperty.property_code}`,
    beforeState,
    afterState,
    changedFields,
    changePatch: {
      op: 'UPDATE_SYSTEM_PROPERTY_VALUE',
      target: {
        id: existingValue.id,
        system_property_id: existingValue.systemPropertyId,
      },
      values: {
        property_item_code: propertyItemCode,
        property_value: propertyValue,
        description,
      },
    },
  });
}

export async function submitDeleteSystemPropertyValueRequest(input: {
  systemPropertyId: number;
  valueId: number;
}) {
  const context = await requirePermission('SYSTEM_PROPERTY_WRITE');
  requirePositiveInteger(input.systemPropertyId, 'System Property');
  requirePositiveInteger(input.valueId, 'System Property Value');

  const systemProperty = await findSystemPropertyById(input.systemPropertyId);

  if (!systemProperty) {
    throw new Error('System Property was not found.');
  }

  const existingValueRow = await findSystemPropertyValueById(
    input.systemPropertyId,
    input.valueId
  );

  if (!existingValueRow) {
    throw new Error('System Property Value was not found.');
  }

  const existingValue = mapManagedSystemPropertyValue(existingValueRow);
  const resourceKey = buildSystemPropertyValueExistingResourceKey(
    systemProperty.property_code,
    existingValue.id
  );

  await ensureNoPendingLock(resourceKey);

  const beforeState = buildSystemPropertyValueSnapshot({
    id: existingValue.id,
    systemPropertyId: existingValue.systemPropertyId,
    propertyCode: systemProperty.property_code,
    propertyItemCode: existingValue.propertyItemCode,
    propertyValue: existingValue.propertyValue,
    description: existingValue.description,
  });

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'REMOVE',
    summary: `Delete System Property Value ${existingValue.propertyItemCode} from ${systemProperty.property_code}`,
    beforeState,
    afterState: null,
    changedFields: buildChangedFields(
      SYSTEM_PROPERTY_VALUE_FIELDS,
      beforeState as Record<string, unknown>,
      null
    ),
    changePatch: {
      op: 'DELETE_SYSTEM_PROPERTY_VALUE',
      target: {
        id: existingValue.id,
        system_property_id: existingValue.systemPropertyId,
      },
    },
  });
}