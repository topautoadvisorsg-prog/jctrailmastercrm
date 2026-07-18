import {
  formatCrmActivityMetadata,
  formatCrmFreshness,
  formatCrmProviderHealthStatus,
  formatCrmTimestamp,
} from '~/pages/crm/utils/crmDashboardFormatters';

describe('crmDashboardFormatters', () => {
  it('formats missing timestamps as operational fallback text', () => {
    expect(formatCrmTimestamp(null)).toBe('No events yet');
    expect(formatCrmFreshness(undefined)).toBe('Waiting for live data');
  });

  it('formats freshness with the generated timestamp', () => {
    const formattedTimestamp = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date('2026-05-29T12:30:00.000Z'));

    expect(formatCrmFreshness('2026-05-29T12:30:00.000Z')).toBe(
      `Updated ${formattedTimestamp}`,
    );
  });

  it('limits metadata summaries to the first two non-empty values', () => {
    expect(
      formatCrmActivityMetadata({
        source: 'manual',
        empty: '',
        provider: 'twilio',
        ignored: 'extra',
      }),
    ).toBe('source: manual / provider: twilio');
  });

  it('formats quiet metadata and provider health states', () => {
    expect(formatCrmActivityMetadata({})).toBe('No additional metadata');
    expect(formatCrmProviderHealthStatus(undefined)).toBe('Quiet');
    expect(formatCrmProviderHealthStatus('quiet')).toBe('Quiet');
    expect(formatCrmProviderHealthStatus('healthy')).toBe('Healthy');
    expect(formatCrmProviderHealthStatus('needs-attention')).toBe(
      'Needs attention',
    );
  });
});
