import { useCallback, useEffect, useState } from 'react';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { type CrmDashboardData } from '@/pages/crm/types/CrmDashboardData';
import { crmDashboardDataSchema } from '~/pages/crm/schemas/crmDashboardDataSchema';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

type UseCrmDashboardDataOptions = {
  metadataVersion?: number | null;
};

type UseCrmDashboardDataResult = {
  data: CrmDashboardData | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
};

export const useCrmDashboardData = ({
  metadataVersion,
}: UseCrmDashboardDataOptions): UseCrmDashboardDataResult => {
  const [data, setData] = useState<CrmDashboardData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((currentReloadToken) => currentReloadToken + 1);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const tokenPair = getTokenPair();
        const token = tokenPair?.accessOrWorkspaceAgnosticToken?.token;

        const response = await fetch(
          `${REACT_APP_SERVER_BASE_URL}/rest/crm/dashboard`,
          {
            headers: {
              Accept: 'application/json',
              ...(isNonEmptyString(token)
                ? { authorization: `Bearer ${token}` }
                : {}),
              ...(isDefined(metadataVersion)
                ? { 'X-Schema-Version': `${metadataVersion}` }
                : {}),
            },
            signal: abortController.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`CRM dashboard request failed (${response.status})`);
        }

        const parsedDashboardData = crmDashboardDataSchema.safeParse(
          await response.json(),
        );

        if (!parsedDashboardData.success) {
          throw new Error('CRM dashboard response was invalid');
        }

        setData(parsedDashboardData.data);
      } catch (caughtError) {
        if (abortController.signal.aborted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error('CRM dashboard request failed'),
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchDashboard();

    return () => abortController.abort();
  }, [metadataVersion, reloadToken]);

  return {
    data,
    error,
    isLoading,
    refetch,
  };
};
