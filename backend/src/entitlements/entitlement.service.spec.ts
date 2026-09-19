import { EntitlementFeature, EntitlementStatus } from '@prisma/client';
import { EntitlementService } from './entitlement.service';

describe('EntitlementService', () => {
  let prisma: {
    entitlement: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  };
  let service: EntitlementService;

  beforeEach(() => {
    process.env.RECALL_ENABLED = 'true';
    delete process.env.RECALL_STUB_GRANT_ALL;
    delete process.env.RECALL_STUB_DEFAULT_STATUS;
    prisma = {
      entitlement: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
    };
    service = new EntitlementService(prisma as never);
  });

  it('denies when no entitlement row exists', async () => {
    const view = await service.getEntitlement(
      'user_1',
      EntitlementFeature.RECALL,
    );
    expect(view.allowed).toBe(false);
    expect(view.status).toBe(EntitlementStatus.inactive);
  });

  it('allows stub grant-all without DB row', async () => {
    process.env.RECALL_STUB_GRANT_ALL = 'true';
    const view = await service.getEntitlement(
      'user_1',
      EntitlementFeature.RECALL,
    );
    expect(view.allowed).toBe(true);
    expect(view.source).toBe('stub_grant_all');
  });

  it('respects DB active entitlement', async () => {
    prisma.entitlement.findUnique.mockResolvedValue({
      status: EntitlementStatus.active,
      validUntil: null,
      source: 'admin',
      feature: EntitlementFeature.RECALL,
    });
    await expect(service.isAllowed('user_1')).resolves.toBe(true);
  });

  it('denies when feature disabled', async () => {
    process.env.RECALL_ENABLED = 'false';
    process.env.RECALL_STUB_GRANT_ALL = 'true';
    const view = await service.getEntitlement('user_1');
    expect(view.allowed).toBe(false);
    expect(view.source).toBe('disabled');
  });
});
