import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { WorkOrderMetadataController } from 'src/modules/custom/work-orders/work-order-metadata.controller';

describe('WorkOrderMetadataController', () => {
  it('keeps the setup endpoints outside the generic Twenty REST object route shape', () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, WorkOrderMetadataController),
    ).toBe('rest/crm');
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        WorkOrderMetadataController.prototype.getSetupStatus,
      ),
    ).toBe('work-orders-setup');
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        WorkOrderMetadataController.prototype.getSetupStatus,
      ),
    ).toBe(RequestMethod.GET);
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        WorkOrderMetadataController.prototype.ensureSetup,
      ),
    ).toBe('work-orders-setup');
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        WorkOrderMetadataController.prototype.ensureSetup,
      ),
    ).toBe(RequestMethod.POST);
  });
});
