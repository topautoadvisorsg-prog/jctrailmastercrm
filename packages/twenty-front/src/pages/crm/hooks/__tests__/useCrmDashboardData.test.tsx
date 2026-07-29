import { renderHook, waitFor } from '@testing-library/react';

import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { useCrmDashboardData } from '~/pages/crm/hooks/useCrmDashboardData';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

jest.mock('@/apollo/utils/getTokenPair', () => ({
  getTokenPair: jest.fn(),
}));

global.fetch = jest.fn();

const mockGetTokenPair = getTokenPair as jest.MockedFunction<
  typeof getTokenPair
>;

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const authTokenExpiresAt = '2100-01-01T00:00:00.000Z';

const dashboardData = {
  generatedAt: '2026-05-29T00:00:00.000Z',
  workspaceId: 'workspace-id',
  summary: {
    totalRecords: 3,
    recentActivityCount: 1,
    providerEventsReceived: 0,
    providerEventsFailed: 0,
    providerEventsDuplicated: 0,
    providerHealthStatus: 'quiet',
  },
  metrics: [
    {
      key: 'contacts',
      label: 'Contacts',
      value: 3,
      description: 'People records available in this workspace.',
    },
  ],
  recentActivities: [],
  providerHealth: [],
};

describe('useCrmDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the CRM dashboard with auth and schema headers', async () => {
    mockGetTokenPair.mockReturnValue({
      accessOrWorkspaceAgnosticToken: {
        expiresAt: authTokenExpiresAt,
        token: 'access-token',
      },
      refreshToken: {
        expiresAt: authTokenExpiresAt,
        token: 'refresh-token',
      },
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dashboardData,
    } as Response);

    const { result } = renderHook(() =>
      useCrmDashboardData({ metadataVersion: 7 }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith(
      `${REACT_APP_SERVER_BASE_URL}/rest/crm/dashboard`,
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          authorization: 'Bearer access-token',
          'X-Schema-Version': '7',
        },
      }),
    );
    expect(result.current.data).toEqual(dashboardData);
    expect(result.current.error).toBeNull();
  });

  it('does not send an empty bearer token', async () => {
    mockGetTokenPair.mockReturnValue({
      accessOrWorkspaceAgnosticToken: {
        expiresAt: authTokenExpiresAt,
        token: '',
      },
      refreshToken: {
        expiresAt: authTokenExpiresAt,
        token: 'refresh-token',
      },
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dashboardData,
    } as Response);

    const { result } = renderHook(() =>
      useCrmDashboardData({ metadataVersion: null }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith(
      `${REACT_APP_SERVER_BASE_URL}/rest/crm/dashboard`,
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
        },
      }),
    );
  });

  it('exposes a readable error when the dashboard request fails', async () => {
    mockGetTokenPair.mockReturnValue(undefined);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response);

    const { result } = renderHook(() =>
      useCrmDashboardData({ metadataVersion: undefined }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe(
      'CRM dashboard request failed (503)',
    );
  });

  it('rejects malformed dashboard responses before updating UI data', async () => {
    mockGetTokenPair.mockReturnValue(undefined);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        workspaceId: 'workspace-id',
        metrics: 'not-an-array',
      }),
    } as Response);

    const { result } = renderHook(() =>
      useCrmDashboardData({ metadataVersion: undefined }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe(
      'CRM dashboard response was invalid',
    );
  });

  it('rejects impossible dashboard values before updating UI data', async () => {
    mockGetTokenPair.mockReturnValue(undefined);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...dashboardData,
        generatedAt: 'not-a-date',
        summary: {
          ...dashboardData.summary,
          totalRecords: -1,
        },
      }),
    } as Response);

    const { result } = renderHook(() =>
      useCrmDashboardData({ metadataVersion: undefined }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe(
      'CRM dashboard response was invalid',
    );
  });
});
