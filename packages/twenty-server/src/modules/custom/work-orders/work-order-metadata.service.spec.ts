import { NotFoundException } from '@nestjs/common';

import { FieldMetadataType, RelationType } from 'twenty-shared/types';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { type ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { type ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import {
  WORK_ORDER_FIELD_DEFINITIONS,
  WORK_ORDER_OBJECT,
} from 'src/modules/custom/work-orders/work-order-metadata.constants';
import { WorkOrderMetadataService } from 'src/modules/custom/work-orders/work-order-metadata.service';

const workspaceId = 'workspace-id';

const authContext = {
  workspace: {
    id: workspaceId,
  },
} as WorkspaceAuthContext;

const createFieldMetadata = (
  name: string,
): ObjectMetadataEntity['fields'][number] =>
  ({
    name,
  }) as ObjectMetadataEntity['fields'][number];

const createObjectMetadata = ({
  id,
  nameSingular,
  fields = [],
}: {
  id: string;
  nameSingular: string;
  fields?: Array<ObjectMetadataEntity['fields'][number]>;
}): ObjectMetadataEntity =>
  ({
    id,
    nameSingular,
    fields,
  }) as ObjectMetadataEntity;

const createWorkOrderObject = (
  fieldNames: string[] = [],
): ObjectMetadataEntity =>
  createObjectMetadata({
    id: 'work-order-object-id',
    nameSingular: WORK_ORDER_OBJECT.nameSingular,
    fields: fieldNames.map(createFieldMetadata),
  });

const allWorkOrderFieldNames = WORK_ORDER_FIELD_DEFINITIONS.map(
  ({ name }) => name,
);

const createService = () => {
  const objectMetadataService = {
    createOneObject: jest.fn().mockResolvedValue(undefined),
    findOneWithinWorkspace: jest.fn(),
  } as unknown as jest.Mocked<ObjectMetadataService>;
  const fieldMetadataService = {
    createManyFields: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<FieldMetadataService>;
  const service = new WorkOrderMetadataService(
    objectMetadataService,
    fieldMetadataService,
  );

  return { fieldMetadataService, objectMetadataService, service };
};

describe('WorkOrderMetadataService', () => {
  it('reports missing setup without mutating metadata', async () => {
    const { fieldMetadataService, objectMetadataService, service } =
      createService();

    objectMetadataService.findOneWithinWorkspace.mockResolvedValue(null);

    await expect(service.getSetupStatus(authContext)).resolves.toMatchObject({
      workspaceId,
      isReady: false,
      object: {
        id: null,
        nameSingular: 'workOrder',
        namePlural: 'workOrders',
        labelSingular: 'Work Order',
        labelPlural: 'Work Orders',
        objectPath: '/objects/workOrders',
        status: 'missing',
      },
      fields: WORK_ORDER_FIELD_DEFINITIONS.map(({ name, label, type }) => ({
        name,
        label,
        type,
        status: 'missing',
      })),
    });
    expect(objectMetadataService.createOneObject).not.toHaveBeenCalled();
    expect(fieldMetadataService.createManyFields).not.toHaveBeenCalled();
  });

  it('creates the Work Order object and all operational fields on first setup', async () => {
    const { fieldMetadataService, objectMetadataService, service } =
      createService();
    let workOrderLookupCount = 0;

    objectMetadataService.findOneWithinWorkspace.mockImplementation(
      async (_currentWorkspaceId, options) => {
        const nameSingular = (
          options.where as { nameSingular?: string } | undefined
        )?.nameSingular;

        if (nameSingular === WORK_ORDER_OBJECT.nameSingular) {
          workOrderLookupCount += 1;

          if (workOrderLookupCount === 1) {
            return null;
          }

          if (workOrderLookupCount === 2) {
            return createWorkOrderObject();
          }

          return createWorkOrderObject(allWorkOrderFieldNames);
        }

        return createObjectMetadata({
          id: `${nameSingular}-object-id`,
          nameSingular: nameSingular ?? 'unknown',
        });
      },
    );

    const response = await service.ensureSetup(authContext);

    expect(objectMetadataService.createOneObject).toHaveBeenCalledWith({
      workspaceId,
      createObjectInput: expect.objectContaining({
        nameSingular: 'workOrder',
        namePlural: 'workOrders',
        labelSingular: 'Work Order',
        labelPlural: 'Work Orders',
        icon: 'IconTool',
        isRemote: false,
      }),
    });
    expect(fieldMetadataService.createManyFields).toHaveBeenCalledTimes(1);

    const createManyFieldsPayload =
      fieldMetadataService.createManyFields.mock.calls[0][0];
    const createFieldInputs = createManyFieldsPayload.createFieldInputs;
    const statusFieldInput = createFieldInputs.find(
      ({ name }) => name === 'status',
    );
    const customerFieldInput = createFieldInputs.find(
      ({ name }) => name === 'customer',
    );

    expect(createManyFieldsPayload.workspaceId).toBe(workspaceId);
    expect(createFieldInputs).toHaveLength(WORK_ORDER_FIELD_DEFINITIONS.length);
    expect(statusFieldInput).toMatchObject({
      name: 'status',
      type: FieldMetadataType.SELECT,
      defaultValue: "'NEW'",
      objectMetadataId: 'work-order-object-id',
    });
    expect(customerFieldInput?.relationCreationPayload).toEqual({
      type: RelationType.MANY_TO_ONE,
      targetObjectMetadataId: 'person-object-id',
      targetFieldLabel: 'Work Orders',
      targetFieldIcon: 'IconTool',
    });
    expect(response).toMatchObject({
      workspaceId,
      isReady: true,
      object: {
        id: 'work-order-object-id',
        status: 'created',
      },
      fields: WORK_ORDER_FIELD_DEFINITIONS.map(({ name }) =>
        expect.objectContaining({
          name,
          status: 'created',
        }),
      ),
    });
  });

  it('repairs a partially configured Work Order object without duplicating existing fields', async () => {
    const { fieldMetadataService, objectMetadataService, service } =
      createService();
    const existingFieldNames = ['status', 'priority'];
    let workOrderLookupCount = 0;

    objectMetadataService.findOneWithinWorkspace.mockImplementation(
      async (_currentWorkspaceId, options) => {
        const nameSingular = (
          options.where as { nameSingular?: string } | undefined
        )?.nameSingular;

        if (nameSingular === WORK_ORDER_OBJECT.nameSingular) {
          workOrderLookupCount += 1;

          return workOrderLookupCount === 1
            ? createWorkOrderObject(existingFieldNames)
            : createWorkOrderObject(allWorkOrderFieldNames);
        }

        return createObjectMetadata({
          id: `${nameSingular}-object-id`,
          nameSingular: nameSingular ?? 'unknown',
        });
      },
    );

    const response = await service.ensureSetup(authContext);
    const createdFieldNames =
      fieldMetadataService.createManyFields.mock.calls[0][0].createFieldInputs.map(
        ({ name }) => name,
      );

    expect(objectMetadataService.createOneObject).not.toHaveBeenCalled();
    expect(createdFieldNames).toEqual(
      WORK_ORDER_FIELD_DEFINITIONS.filter(
        ({ name }) => !existingFieldNames.includes(name),
      ).map(({ name }) => name),
    );
    expect(response.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'status', status: 'existing' }),
        expect.objectContaining({ name: 'priority', status: 'existing' }),
        expect.objectContaining({ name: 'customer', status: 'created' }),
      ]),
    );
  });

  it('is idempotent after the Work Order setup is ready', async () => {
    const { fieldMetadataService, objectMetadataService, service } =
      createService();

    objectMetadataService.findOneWithinWorkspace.mockResolvedValue(
      createWorkOrderObject(allWorkOrderFieldNames),
    );

    await expect(service.ensureSetup(authContext)).resolves.toMatchObject({
      workspaceId,
      isReady: true,
      object: {
        id: 'work-order-object-id',
        status: 'existing',
      },
      fields: WORK_ORDER_FIELD_DEFINITIONS.map(({ name }) =>
        expect.objectContaining({
          name,
          status: 'existing',
        }),
      ),
    });
    expect(objectMetadataService.createOneObject).not.toHaveBeenCalled();
    expect(fieldMetadataService.createManyFields).not.toHaveBeenCalled();
  });

  it('fails setup clearly when a required relation target object is missing', async () => {
    const { objectMetadataService, service } = createService();
    let workOrderLookupCount = 0;

    objectMetadataService.findOneWithinWorkspace.mockImplementation(
      async (_currentWorkspaceId, options) => {
        const nameSingular = (
          options.where as { nameSingular?: string } | undefined
        )?.nameSingular;

        if (nameSingular === WORK_ORDER_OBJECT.nameSingular) {
          workOrderLookupCount += 1;

          return workOrderLookupCount === 1 ? null : createWorkOrderObject();
        }

        if (nameSingular === 'person') {
          return null;
        }

        return createObjectMetadata({
          id: `${nameSingular}-object-id`,
          nameSingular: nameSingular ?? 'unknown',
        });
      },
    );

    await expect(service.ensureSetup(authContext)).rejects.toThrow(
      NotFoundException,
    );
  });
});
