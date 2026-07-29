import { Injectable, NotFoundException } from '@nestjs/common';

import {
  FieldMetadataType,
  type RelationCreationPayload,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type CreateFieldInput } from 'src/engine/metadata-modules/field-metadata/dtos/create-field.input';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { type ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import {
  WORK_ORDER_FIELD_DEFINITIONS,
  WORK_ORDER_OBJECT,
  type WorkOrderFieldDefinition,
} from 'src/modules/custom/work-orders/work-order-metadata.constants';
import {
  type WorkOrderSetupField,
  type WorkOrderSetupObject,
  type WorkOrderSetupResponse,
} from 'src/modules/custom/work-orders/work-order-metadata.types';

@Injectable()
export class WorkOrderMetadataService {
  constructor(
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
  ) {}

  async getSetupStatus(
    authContext: WorkspaceAuthContext,
  ): Promise<WorkOrderSetupResponse> {
    const workspaceId = authContext.workspace.id;
    const workOrderObject = await this.findWorkOrderObject(workspaceId);

    return this.buildSetupResponse({
      workspaceId,
      workOrderObject,
      objectStatus: isDefined(workOrderObject) ? 'existing' : 'missing',
      createdFieldNames: new Set(),
    });
  }

  async ensureSetup(
    authContext: WorkspaceAuthContext,
  ): Promise<WorkOrderSetupResponse> {
    const workspaceId = authContext.workspace.id;
    let workOrderObject = await this.findWorkOrderObject(workspaceId);
    const objectStatus = isDefined(workOrderObject) ? 'existing' : 'created';

    if (!isDefined(workOrderObject)) {
      await this.objectMetadataService.createOneObject({
        createObjectInput: {
          nameSingular: WORK_ORDER_OBJECT.nameSingular,
          namePlural: WORK_ORDER_OBJECT.namePlural,
          labelSingular: WORK_ORDER_OBJECT.labelSingular,
          labelPlural: WORK_ORDER_OBJECT.labelPlural,
          description: WORK_ORDER_OBJECT.description,
          icon: WORK_ORDER_OBJECT.icon,
          color: WORK_ORDER_OBJECT.color,
          isRemote: false,
        },
        workspaceId,
      });

      workOrderObject = await this.findWorkOrderObject(workspaceId);
    }

    if (!isDefined(workOrderObject)) {
      throw new NotFoundException('Work Order object metadata was not created');
    }

    const existingFieldNames = this.getExistingFieldNames(workOrderObject);
    const missingFieldDefinitions = WORK_ORDER_FIELD_DEFINITIONS.filter(
      (fieldDefinition) => !existingFieldNames.has(fieldDefinition.name),
    );

    if (missingFieldDefinitions.length > 0) {
      const createFieldInputs: Array<Omit<CreateFieldInput, 'workspaceId'>> =
        [];

      for (const fieldDefinition of missingFieldDefinitions) {
        createFieldInputs.push(
          await this.buildCreateFieldInput({
            workspaceId,
            workOrderObjectId: workOrderObject.id,
            fieldDefinition,
          }),
        );
      }

      await this.fieldMetadataService.createManyFields({
        createFieldInputs,
        workspaceId,
      });
    }

    const createdFieldNames = new Set(
      missingFieldDefinitions.map((fieldDefinition) => fieldDefinition.name),
    );
    const refreshedWorkOrderObject =
      (await this.findWorkOrderObject(workspaceId)) ?? workOrderObject;

    return this.buildSetupResponse({
      workspaceId,
      workOrderObject: refreshedWorkOrderObject,
      objectStatus,
      createdFieldNames,
    });
  }

  private async buildCreateFieldInput({
    workspaceId,
    workOrderObjectId,
    fieldDefinition,
  }: {
    workspaceId: string;
    workOrderObjectId: string;
    fieldDefinition: WorkOrderFieldDefinition;
  }): Promise<Omit<CreateFieldInput, 'workspaceId'>> {
    const relationCreationPayload = isDefined(fieldDefinition.relation)
      ? await this.buildRelationCreationPayload({
          workspaceId,
          fieldDefinition,
        })
      : undefined;

    return {
      type: fieldDefinition.type,
      name: fieldDefinition.name,
      label: fieldDefinition.label,
      description: fieldDefinition.description,
      icon: fieldDefinition.icon,
      isNullable: fieldDefinition.isNullable,
      isUnique: false,
      objectMetadataId: workOrderObjectId,
      ...(isDefined(fieldDefinition.defaultValue)
        ? { defaultValue: fieldDefinition.defaultValue }
        : {}),
      ...(isDefined(fieldDefinition.options)
        ? { options: fieldDefinition.options }
        : {}),
      ...(isDefined(relationCreationPayload)
        ? { relationCreationPayload }
        : {}),
    } as Omit<CreateFieldInput, 'workspaceId'>;
  }

  private async buildRelationCreationPayload({
    workspaceId,
    fieldDefinition,
  }: {
    workspaceId: string;
    fieldDefinition: WorkOrderFieldDefinition;
  }): Promise<RelationCreationPayload | undefined> {
    if (!isDefined(fieldDefinition.relation)) {
      return undefined;
    }

    if (fieldDefinition.type !== FieldMetadataType.RELATION) {
      throw new Error(
        `Work Order field ${fieldDefinition.name} has relation config but is not a relation field`,
      );
    }

    const targetObject =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { nameSingular: fieldDefinition.relation.targetObjectName },
      });

    if (!isDefined(targetObject)) {
      throw new NotFoundException(
        `Required object metadata not found: ${fieldDefinition.relation.targetObjectName}`,
      );
    }

    return {
      type: fieldDefinition.relation.type,
      targetObjectMetadataId: targetObject.id,
      targetFieldLabel: fieldDefinition.relation.targetFieldLabel,
      targetFieldIcon: fieldDefinition.relation.targetFieldIcon,
    };
  }

  private async findWorkOrderObject(
    workspaceId: string,
  ): Promise<ObjectMetadataEntity | null> {
    return this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
      where: { nameSingular: WORK_ORDER_OBJECT.nameSingular },
    });
  }

  private buildSetupResponse({
    workspaceId,
    workOrderObject,
    objectStatus,
    createdFieldNames,
  }: {
    workspaceId: string;
    workOrderObject: ObjectMetadataEntity | null;
    objectStatus: WorkOrderSetupObject['status'];
    createdFieldNames: Set<string>;
  }): WorkOrderSetupResponse {
    const existingFieldNames = this.getExistingFieldNames(workOrderObject);
    const fields = WORK_ORDER_FIELD_DEFINITIONS.map<WorkOrderSetupField>(
      (fieldDefinition) => ({
        name: fieldDefinition.name,
        label: fieldDefinition.label,
        type: fieldDefinition.type,
        status: createdFieldNames.has(fieldDefinition.name)
          ? 'created'
          : existingFieldNames.has(fieldDefinition.name)
            ? 'existing'
            : 'missing',
      }),
    );

    return {
      workspaceId,
      isReady:
        isDefined(workOrderObject) &&
        fields.every((field) => field.status !== 'missing'),
      object: {
        id: workOrderObject?.id ?? null,
        nameSingular: WORK_ORDER_OBJECT.nameSingular,
        namePlural: WORK_ORDER_OBJECT.namePlural,
        labelSingular: WORK_ORDER_OBJECT.labelSingular,
        labelPlural: WORK_ORDER_OBJECT.labelPlural,
        objectPath: WORK_ORDER_OBJECT.objectPath,
        status: objectStatus,
      },
      fields,
    };
  }

  private getExistingFieldNames(
    workOrderObject: ObjectMetadataEntity | null,
  ): Set<string> {
    return new Set(
      workOrderObject?.fields?.map((fieldMetadata) => fieldMetadata.name) ?? [],
    );
  }
}
