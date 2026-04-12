import 'server-only';

import { db } from '@/lib/db';
import { getAuthenticatedUserContext } from '@/lib/auth/authorization';

type SystemCodeStatus = 'ACTIVE' | 'INACTIVE';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type SystemCodeRequestAction = 'CREATE' | 'UPDATE';

type SystemCodeListRow = {
  id: number | string;
  system_code: string;
  description: string;
  status: SystemCodeStatus;
  value_count: number | string;
  updated_at: Date | string;
};

type ExistingSystemCodeRow = SystemCodeListRow;

type ExistingSystemCodeValueRow = {
  id: number | string;
  system_code_id: number | string;
  system_code_value: string;
  description: string;
  status: SystemCodeStatus;
  sort_order: number | string;
  updated_at: Date | string;
};

type ApprovalRequestRow = {
  id: number | string;
  resource_key: string;
  action_type: SystemCodeRequestAction;
  status: ApprovalStatus;
  summary: string;
  submitted_by_user_id: number | string | null;
  submitted_by_display_name: string | null;
  submitted_at: Date | string;
};

type SystemCodeValueSnapshot = {
  id?: number;
  system_code_value: string;
  description: string;
  status: SystemCodeStatus;
  sort_order: number;
};

type SystemCodeSnapshot = {
  id?: number;
  system_code: string;
  description: string;
  status: SystemCodeStatus;
  values: SystemCodeValueSnapshot[];
};

type SystemCodeChangedField = {
  before: unknown;
  after: unknown;
};

type SystemCodeChangedFields = Record<string, SystemCodeChangedField>;

type SystemCodeValuePatch = {
  system_code_value: string;
  description: string;
  status: SystemCodeStatus;
  sort_order: number;
};

type CreateSystemCodePatch = {
  op: 'CREATE_SYSTEM_CODE';
  target: {
    id: number;
  };
  values: {
    system_code: string;
    description: string;
    status: SystemCodeStatus;
  };
};

type UpdateSystemCodePatch = {
  op: 'UPDATE_SYSTEM_CODE';
  target: {
    id: number;
  };
  values: {
    description: string;
    status: SystemCodeStatus;
    add_values: SystemCodeValuePatch[];
    remove_value_ids: number[];
  };
};

export type SystemCodeChangePatch =
  | CreateSystemCodePatch
  | UpdateSystemCodePatch;

export type ManagedSystemCodeValue = {
  id: number;
  systemCodeId: number;
  systemCodeValue: string;
  description: string;
  status: SystemCodeStatus;
  sortOrder: number;
  updatedAt: string;
};

export type ManagedSystemCode = {
  id: number;
  systemCode: string;
  description: string;
  status: SystemCodeStatus;
  valueCount: number;
  updatedAt: string;
};

export type ManagedSystemCodeDetail = ManagedSystemCode & {
  values: ManagedSystemCodeValue[];
};

export type PaginatedSystemCodeSearchResult = {
  rows: ManagedSystemCode[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type PendingSystemCodeRequest = {
  id: number;
  resourceKey: string;
  actionType: SystemCodeRequestAction;
  summary: string;
  submittedByUserId: number | null;
  submittedByDisplayName: string | null;
  submittedAt: string;
};

export type NewSystemCodeValueInput = {
  systemCodeValue: string;
  description: string;
  status: string;
  sortOrder: number;
};

const SYSTEM_CODE_RESOURCE_TYPE = 'SYSTEM_CODE';
const OWNER_ORGANIZATION_CODE = 'owner';
const SYSTEM_CODE_FIELDS = ['system_code', 'description', 'status'] as const;

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

function validateSystemCode(systemCode: string) {
  const normalized = systemCode.trim();

  if (!/^[A-Za-z0-9_-]{2,100}$/.test(normalized)) {
    throw new Error(
      'System Code must be 2 to 100 characters and use only letters, numbers, hyphens, or underscores.'
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

function validateStatus(status: string): SystemCodeStatus {
  if (status !== 'ACTIVE' && status !== 'INACTIVE') {
    throw new Error('Status must be ACTIVE or INACTIVE.');
  }

  return status;
}

function validateSortOrder(sortOrder: number) {
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error('Sort Order must be a whole number that is 0 or greater.');
  }

  return sortOrder;
}

function validateSystemCodeValue(systemCodeValue: string) {
  const normalized = systemCodeValue.trim();

  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(normalized)) {
    throw new Error(
      'System Code Value must be 1 to 100 characters and use only letters, numbers, periods, hyphens, or underscores.'
    );
  }

  return normalized;
}

function buildSystemCodeResourceKey(systemCode: string) {
  return `SYSTEM_CODE:${systemCode}`;
}

function mapManagedSystemCode(row: SystemCodeListRow): ManagedSystemCode {
  return {
    id: toNumber(row.id),
    systemCode: row.system_code,
    description: row.description,
    status: row.status,
    valueCount: toNumber(row.value_count),
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapManagedSystemCodeValue(
  row: ExistingSystemCodeValueRow
): ManagedSystemCodeValue {
  return {
    id: toNumber(row.id),
    systemCodeId: toNumber(row.system_code_id),
    systemCodeValue: row.system_code_value,
    description: row.description,
    status: row.status,
    sortOrder: toNumber(row.sort_order),
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapPendingSystemCodeRequest(
  row: ApprovalRequestRow
): PendingSystemCodeRequest {
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

function buildValueSnapshot(
  value: ManagedSystemCodeValue | SystemCodeValuePatch
): SystemCodeValueSnapshot {
  const systemCodeValue =
    'systemCodeValue' in value ? value.systemCodeValue : value.system_code_value;
  const sortOrder = 'sortOrder' in value ? value.sortOrder : value.sort_order;

  return {
    ...('id' in value && typeof value.id === 'number' ? { id: value.id } : {}),
    system_code_value: systemCodeValue,
    description: value.description,
    status: value.status,
    sort_order: sortOrder,
  };
}

function buildSystemCodeSnapshot(input: {
  id?: number;
  systemCode: string;
  description: string;
  status: SystemCodeStatus;
  values: Array<ManagedSystemCodeValue | SystemCodeValuePatch>;
}): SystemCodeSnapshot {
  return {
    ...(input.id ? { id: input.id } : {}),
    system_code: input.systemCode,
    description: input.description,
    status: input.status,
    values: input.values
      .map(buildValueSnapshot)
      .sort((left, right) => left.sort_order - right.sort_order),
  };
}

function buildChangedFields(input: {
  beforeState: SystemCodeSnapshot | null;
  afterState: SystemCodeSnapshot | null;
  addedValues: SystemCodeValuePatch[];
  removedValues: ManagedSystemCodeValue[];
}) {
  const changedFields: SystemCodeChangedFields = {};

  for (const field of SYSTEM_CODE_FIELDS) {
    const beforeValue = input.beforeState?.[field] ?? null;
    const afterValue = input.afterState?.[field] ?? null;

    if (beforeValue === afterValue) {
      continue;
    }

    changedFields[field] = {
      before: beforeValue,
      after: afterValue,
    };
  }

  if (input.addedValues.length > 0) {
    changedFields.added_values = {
      before: null,
      after: input.addedValues.map((value) => buildValueSnapshot(value)),
    };
  }

  if (input.removedValues.length > 0) {
    changedFields.removed_values = {
      before: input.removedValues.map((value) => buildValueSnapshot(value)),
      after: null,
    };
  }

  return Object.keys(changedFields).length > 0 ? changedFields : null;
}

async function requirePermission(permissionCode: string) {
  const context = await getAuthenticatedUserContext();

  if (context.session.organizationCode !== OWNER_ORGANIZATION_CODE) {
    throw new Error(
      'Only users in the Owner organization can access System Code management.'
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
    [SYSTEM_CODE_RESOURCE_TYPE, resourceKey]
  );

  if (existingLock) {
    throw new Error(
      'A pending System Code request already exists for this resource.'
    );
  }
}

async function findSystemCodeById(systemCodeId: number) {
  return db.queryOne<ExistingSystemCodeRow>(
    `
      select
        sc.id,
        sc.system_code,
        sc.description,
        sc.status,
        count(distinct scv.id) as value_count,
        CONCAT(DATE_FORMAT(sc.updated_at, '%Y-%m-%dT%T.000'), 'Z') AS updated_at
      from system_codes sc
      left join system_code_values scv
        on scv.system_code_id = sc.id
      where sc.id = ?
      group by
        sc.id,
        sc.system_code,
        sc.description,
        sc.status,
        sc.updated_at
    `,
    [systemCodeId]
  );
}

async function findSystemCodeByCode(systemCode: string) {
  return db.queryOne<{ id: number | string; status: SystemCodeStatus }>(
    `
      select
        id,
        status
      from system_codes
      where system_code = ?
    `,
    [systemCode]
  );
}

async function findSystemCodeValues(systemCodeId: number) {
  return db.query<ExistingSystemCodeValueRow>(
    `
      select
        scv.id,
        scv.system_code_id,
        scv.system_code_value,
        scv.description,
        scv.status,
        scv.sort_order,
        scv.updated_at
      from system_code_values scv
      where scv.system_code_id = ?
      order by scv.sort_order asc, scv.system_code_value asc, scv.id desc
    `,
    [systemCodeId]
  );
}

async function recordApprovalSubmission(input: {
  organizationId: number;
  actorUserId: number;
  approvalRequestId: number;
  resourceKey: string;
  actionType: SystemCodeRequestAction;
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
      values (?, ?, 'SYSTEM_CODE_CHANGE_SUBMITTED', ?, ?, ?, ?)
    `,
    [
      input.organizationId,
      input.actorUserId,
      SYSTEM_CODE_RESOURCE_TYPE,
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
  actionType: SystemCodeRequestAction;
  summary: string;
  beforeState: SystemCodeSnapshot | null;
  afterState: SystemCodeSnapshot | null;
  changedFields: SystemCodeChangedFields | null;
  changePatch: SystemCodeChangePatch;
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
      SYSTEM_CODE_RESOURCE_TYPE,
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
      [SYSTEM_CODE_RESOURCE_TYPE, input.resourceKey, approvalRequestId]
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

function validateNewValues(inputValues: NewSystemCodeValueInput[]) {
  const normalizedValues: SystemCodeValuePatch[] = [];
  const seenValues = new Set<string>();

  for (const inputValue of inputValues) {
    const systemCodeValue = inputValue.systemCodeValue.trim();
    const description = inputValue.description.trim();

    if (!systemCodeValue && !description) {
      continue;
    }

    const validatedValue = validateSystemCodeValue(systemCodeValue);
    const normalizedKey = validatedValue.toUpperCase();

    if (seenValues.has(normalizedKey)) {
      throw new Error(
        `New System Code Value ${validatedValue} is duplicated in the request.`
      );
    }

    seenValues.add(normalizedKey);
    normalizedValues.push({
      system_code_value: validatedValue,
      description: validateDescription(description, 'System Code Value Description'),
      status: validateStatus(inputValue.status),
      sort_order: validateSortOrder(inputValue.sortOrder),
    });
  }

  return normalizedValues;
}

export async function searchApprovedSystemCodesPage(input: {
  systemCodeQuery?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedSystemCodeSearchResult> {
  await requirePermission('SYSTEM_CODE_READ');

  const searchQuery = (input.systemCodeQuery ?? '').trim();
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 10, 100));
  const page = Math.max(1, input.page ?? 1);
  const offset = (page - 1) * pageSize;

  const totalRow = await db.queryOne<{ total_count: number | string }>(
    `
      select
        count(*) as total_count
      from system_codes sc
      where (? = ''
        or sc.system_code like concat('%', ?, '%')
        or sc.description like concat('%', ?, '%'))
    `,
    [searchQuery, searchQuery, searchQuery]
  );

  const rows = await db.query<SystemCodeListRow>(
    `
      select
        sc.id,
        sc.system_code,
        sc.description,
        sc.status,
        count(distinct scv.id) as value_count,
        CONCAT(DATE_FORMAT(sc.updated_at, '%Y-%m-%dT%T.000'), 'Z') AS updated_at
      from system_codes sc
      left join system_code_values scv
        on scv.system_code_id = sc.id
      where (? = ''
        or sc.system_code like concat('%', ?, '%')
        or sc.description like concat('%', ?, '%'))
      group by
        sc.id,
        sc.system_code,
        sc.description,
        sc.status,
        sc.updated_at
      order by sc.system_code asc, sc.id desc
      limit ? offset ?
    `,
    [searchQuery, searchQuery, searchQuery, pageSize, offset]
  );

  return {
    rows: rows.map(mapManagedSystemCode),
    totalCount: toNumber(totalRow?.total_count),
    page,
    pageSize,
  };
}

export async function getApprovedSystemCodeById(
  systemCodeId: number
): Promise<ManagedSystemCodeDetail | null> {
  await requirePermission('SYSTEM_CODE_READ');

  const systemCode = await findSystemCodeById(systemCodeId);

  if (!systemCode) {
    return null;
  }

  const values = await findSystemCodeValues(systemCodeId);

  return {
    ...mapManagedSystemCode(systemCode),
    values: values.map(mapManagedSystemCodeValue),
  };
}

export async function listPendingSystemCodeRequests() {
  const context = await requirePermission('SYSTEM_CODE_READ');
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
    [context.session.organizationId, SYSTEM_CODE_RESOURCE_TYPE]
  );

  return rows.map(mapPendingSystemCodeRequest);
}

export function buildSystemCodeRouteResourceKey(systemCode: string) {
  return buildSystemCodeResourceKey(systemCode);
}

export async function submitCreateSystemCodeRequest(input: {
  systemCode: string;
  description: string;
  status: string;
}) {
  const context = await requirePermission('SYSTEM_CODE_WRITE');
  const systemCode = validateSystemCode(input.systemCode);
  const description = validateDescription(input.description);
  const status = validateStatus(input.status);
  const resourceKey = buildSystemCodeResourceKey(systemCode);

  await ensureNoPendingLock(resourceKey);

  const existingSystemCode = await findSystemCodeByCode(systemCode);

  if (existingSystemCode) {
    throw new Error('A System Code with this code already exists.');
  }

  const insertResult = await db.execute(
    `
      insert into system_codes (
        system_code,
        description,
        status
      )
      values (?, ?, 'INACTIVE')
    `,
    [systemCode, description]
  );

  const createdId = toNumber(insertResult.insertId);

  requirePositiveInteger(createdId, 'System Code');

  const afterState = buildSystemCodeSnapshot({
    id: createdId,
    systemCode,
    description,
    status,
    values: [],
  });

  try {
    await createApprovalRequest({
      organizationId: context.session.organizationId,
      actorUserId: context.session.userId,
      resourceKey,
      actionType: 'CREATE',
      summary: `Create System Code ${systemCode}`,
      beforeState: null,
      afterState,
      changedFields: buildChangedFields({
        beforeState: null,
        afterState,
        addedValues: [],
        removedValues: [],
      }),
      changePatch: {
        op: 'CREATE_SYSTEM_CODE',
        target: {
          id: createdId,
        },
        values: {
          system_code: systemCode,
          description,
          status,
        },
      },
    });
  } catch (error) {
    await db.execute('delete from system_codes where id = ?', [createdId]);
    throw error;
  }
}

export async function submitUpdateSystemCodeRequest(input: {
  systemCodeId: number;
  description: string;
  status: string;
  removeValueIds: number[];
  newValues: NewSystemCodeValueInput[];
}) {
  const context = await requirePermission('SYSTEM_CODE_WRITE');
  requirePositiveInteger(input.systemCodeId, 'System Code');

  const description = validateDescription(input.description);
  const status = validateStatus(input.status);
  const systemCode = await findSystemCodeById(input.systemCodeId);

  if (!systemCode) {
    throw new Error('System Code was not found.');
  }

  const existingValues = (await findSystemCodeValues(input.systemCodeId)).map(
    mapManagedSystemCodeValue
  );
  const resourceKey = buildSystemCodeResourceKey(systemCode.system_code);

  await ensureNoPendingLock(resourceKey);

  const removeValueIds = Array.from(
    new Set(
      input.removeValueIds.map((valueId) => {
        const normalized = Number(valueId);
        requirePositiveInteger(normalized, 'System Code Value');
        return normalized;
      })
    )
  );
  const removableValueIds = new Set(existingValues.map((value) => value.id));

  for (const valueId of removeValueIds) {
    if (!removableValueIds.has(valueId)) {
      throw new Error('One or more selected System Code Values are invalid.');
    }
  }

  const newValues = validateNewValues(input.newValues);
  const retainedValues = existingValues.filter(
    (value) => !removeValueIds.includes(value.id)
  );
  const removedValues = existingValues.filter((value) =>
    removeValueIds.includes(value.id)
  );
  const existingValueCodes = new Set(
    retainedValues.map((value) => value.systemCodeValue.toUpperCase())
  );

  for (const newValue of newValues) {
    const normalizedValueCode = newValue.system_code_value.toUpperCase();

    if (existingValueCodes.has(normalizedValueCode)) {
      throw new Error(
        `System Code Value ${newValue.system_code_value} already exists for this System Code.`
      );
    }

    existingValueCodes.add(normalizedValueCode);
  }

  const beforeState = buildSystemCodeSnapshot({
    id: toNumber(systemCode.id),
    systemCode: systemCode.system_code,
    description: systemCode.description,
    status: systemCode.status,
    values: existingValues,
  });
  const afterState = buildSystemCodeSnapshot({
    id: toNumber(systemCode.id),
    systemCode: systemCode.system_code,
    description,
    status,
    values: [...retainedValues, ...newValues],
  });
  const changedFields = buildChangedFields({
    beforeState,
    afterState,
    addedValues: newValues,
    removedValues,
  });

  if (!changedFields) {
    throw new Error('No System Code changes were provided.');
  }

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'UPDATE',
    summary: `Update System Code ${systemCode.system_code}`,
    beforeState,
    afterState,
    changedFields,
    changePatch: {
      op: 'UPDATE_SYSTEM_CODE',
      target: {
        id: toNumber(systemCode.id),
      },
      values: {
        description,
        status,
        add_values: newValues,
        remove_value_ids: removeValueIds,
      },
    },
  });
}