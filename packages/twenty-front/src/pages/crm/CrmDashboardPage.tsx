import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import {
  IconAlertTriangle,
  IconBriefcase,
  IconBuildingSkyscraper,
  IconCalendar,
  IconChartBar,
  IconMessage,
  IconPhone,
  IconRefresh,
  IconShield,
  IconTool,
  IconUsers,
} from 'twenty-ui/display';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';

import { useCrmDashboardData } from './hooks/useCrmDashboardData';
import { type CrmDashboardMetricKey } from './types/CrmDashboardData';
import {
  formatCrmActivityMetadata,
  formatCrmFreshness,
  formatCrmProviderHealthStatus,
  formatCrmTimestamp,
} from './utils/crmDashboardFormatters';

const objectLinks = [
  {
    label: 'Contacts',
    description: 'People, owners, consent, and follow-up context.',
    to: AppPath.CrmContacts,
    Icon: IconUsers,
  },
  {
    label: 'Companies',
    description: 'Accounts, relationships, and service history.',
    to: AppPath.CrmCompanies,
    Icon: IconBuildingSkyscraper,
  },
  {
    label: 'Deals',
    description: 'Pipeline value, stage movement, and close priorities.',
    to: AppPath.CrmDeals,
    Icon: IconBriefcase,
  },
  {
    label: 'Tasks',
    description: "Today's calls, visits, reminders, and promises.",
    to: AppPath.CrmTasks,
    Icon: IconCalendar,
  },
  {
    label: 'Work Orders',
    description: 'Jobs, service status, schedules, and technician ownership.',
    to: AppPath.CrmWorkOrders,
    Icon: IconTool,
  },
];

const metricIconByKey: Record<CrmDashboardMetricKey, typeof IconUsers> = {
  contacts: IconUsers,
  companies: IconBuildingSkyscraper,
  deals: IconBriefcase,
  tasks: IconCalendar,
  workOrders: IconTool,
};

const readinessGroups = [
  {
    title: 'Ready now',
    description: 'Foundational CRM services that are safe without API keys.',
    items: [
      {
        label: 'SMS consent controls',
        state: 'Backend guardrails ready',
        Icon: IconMessage,
      },
      {
        label: 'Provider webhook audit',
        state: 'Persistence ready',
        Icon: IconBriefcase,
      },
      {
        label: 'CRM dashboard endpoint',
        state: 'Authenticated',
        Icon: IconBuildingSkyscraper,
      },
    ],
  },
  {
    title: 'Waiting on keys',
    description:
      'Provider features intentionally disabled until credentials exist.',
    items: [
      {
        label: 'Missed-call text back',
        state: 'Twilio keys pending',
        Icon: IconPhone,
      },
      {
        label: 'Outbound email',
        state: 'Email provider pending',
        Icon: IconMessage,
      },
      {
        label: 'AI assistance',
        state: 'AI provider pending',
        Icon: IconBriefcase,
      },
    ],
  },
  {
    title: 'Deployment required',
    description: 'Runtime services needed before production provider traffic.',
    items: [
      {
        label: 'Nest API service',
        state: 'Long-running backend',
        Icon: IconBuildingSkyscraper,
      },
      {
        label: 'Worker process',
        state: 'Background jobs',
        Icon: IconCalendar,
      },
      {
        label: 'Webhook origin',
        state: 'Public HTTPS URL',
        Icon: IconPhone,
      },
    ],
  },
];

const StyledPage = styled(PageContainer)`
  background: ${themeCssVariables.background.primary};
  min-height: 100%;
`;

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[8]};

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    padding: ${themeCssVariables.spacing[4]};
  }
`;

const StyledHeaderRow = styled.div`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[4]};
  justify-content: space-between;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    flex-direction: column;
  }
`;

const StyledHeaderActions = styled.div`
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    align-items: flex-start;
  }
`;

const StyledHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledEyebrow = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledTitle = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: 28px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0;
  line-height: 36px;
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  line-height: 22px;
  margin: 0;
  max-width: 720px;
`;

const StyledRefreshButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  gap: ${themeCssVariables.spacing[2]};
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &:disabled {
    color: ${themeCssVariables.font.color.tertiary};
    cursor: default;
  }
`;

const StyledFreshness = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 18px;
  text-align: right;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    text-align: left;
  }
`;

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 1120px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: 1fr;
  }
`;

const StyledSnapshotGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 1120px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: 1fr;
  }
`;

const StyledSnapshotCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: ${themeCssVariables.spacing[7]} 1fr;
  min-height: 92px;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledMetricValue = styled.div`
  font-size: 28px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0;
  line-height: 34px;
`;

const StyledObjectLink = styled(Link)`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 132px;
  padding: ${themeCssVariables.spacing[4]};
  text-decoration: none;

  &:hover {
    border-color: ${themeCssVariables.border.color.medium};
  }
`;

const StyledMetricCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 132px;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledCardIcon = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  height: ${themeCssVariables.spacing[7]};
  justify-content: center;
  width: ${themeCssVariables.spacing[7]};
`;

const StyledCardTitle = styled.div`
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledCardDescription = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 20px;
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledTwoColumnGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.8fr);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const StyledSectionTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0;
  margin: 0;
`;

const StyledPanel = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
`;

const StyledPanelRow = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 1fr auto;
  min-height: 56px;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};

  & + & {
    border-top: 1px solid ${themeCssVariables.border.color.light};
  }

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: 1fr;
  }
`;

const StyledPanelRowWithIcon = styled(StyledPanelRow)`
  grid-template-columns: ${themeCssVariables.spacing[7]} 1fr auto;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: ${themeCssVariables.spacing[7]} 1fr;
  }
`;

const StyledPanelPrimary = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledPanelSecondary = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 20px;
`;

const StyledPanelTrailing = styled(StyledPanelSecondary)`
  text-align: right;
  white-space: nowrap;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-column: 2;
    text-align: left;
    white-space: normal;
  }
`;

const StyledPanelMeta = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 18px;
`;

const StyledEmptyState = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledErrorState = styled.div`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledReadinessList = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
`;

const StyledReadinessGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

const StyledReadinessGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledReadinessGroupHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledReadinessItem = styled.div`
  align-items: center;
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: ${themeCssVariables.spacing[7]} 1fr auto;
  min-height: 56px;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};

  & + & {
    border-top: 1px solid ${themeCssVariables.border.color.light};
  }

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: ${themeCssVariables.spacing[7]} 1fr;
  }
`;

const StyledStatus = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  white-space: nowrap;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-column: 2;
    white-space: normal;
  }
`;

export const CrmDashboardPage = () => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const { data, error, isLoading, refetch } = useCrmDashboardData({
    metadataVersion: currentWorkspace?.metadataVersion,
  });
  const summary = data?.summary;
  const snapshotItems = [
    {
      label: 'CRM records',
      value:
        summary?.totalRecords.toLocaleString() ?? (isLoading ? '...' : '0'),
      description: 'Contacts, companies, deals, tasks, and work orders.',
      Icon: IconChartBar,
    },
    {
      label: 'Recent activity',
      value:
        summary?.recentActivityCount.toLocaleString() ??
        (isLoading ? '...' : '0'),
      description: 'Audit events returned in this snapshot.',
      Icon: IconBriefcase,
    },
    {
      label: 'Provider status',
      value: formatCrmProviderHealthStatus(summary?.providerHealthStatus),
      description: 'Webhook health based on received provider events.',
      Icon:
        summary?.providerHealthStatus === 'needs-attention'
          ? IconAlertTriangle
          : IconShield,
    },
    {
      label: 'Provider exceptions',
      value:
        summary === undefined
          ? isLoading
            ? '...'
            : '0'
          : (
              summary.providerEventsFailed + summary.providerEventsDuplicated
            ).toLocaleString(),
      description: 'Failed or duplicate webhook events.',
      Icon: IconMessage,
    },
  ];

  return (
    <StyledPage>
      <StyledContent>
        <StyledHeaderRow>
          <StyledHeader>
            <StyledEyebrow>
              {currentWorkspace?.displayName ?? 'Workspace'} / 21 CRM
            </StyledEyebrow>
            <StyledTitle>Sales and customer operations</StyledTitle>
            <StyledSubtitle>
              Live CRM command center for contacts, companies, deals, tasks,
              work orders, provider events, and audit activity. External
              communication providers stay on placeholders until credentials are
              configured.
            </StyledSubtitle>
          </StyledHeader>

          <StyledHeaderActions>
            <StyledRefreshButton disabled={isLoading} onClick={refetch}>
              <IconRefresh size={14} />
              Refresh
            </StyledRefreshButton>
            <StyledFreshness>
              {formatCrmFreshness(data?.generatedAt)}
            </StyledFreshness>
          </StyledHeaderActions>
        </StyledHeaderRow>

        {error !== null && (
          <StyledErrorState>
            <StyledPanelPrimary>
              CRM dashboard data is unavailable.
            </StyledPanelPrimary>
            <StyledPanelSecondary>
              {error.message}. The page remains usable through the core Twenty
              object links below.
            </StyledPanelSecondary>
          </StyledErrorState>
        )}

        <StyledSection>
          <StyledSectionTitle>Operational snapshot</StyledSectionTitle>
          <StyledSnapshotGrid>
            {snapshotItems.map(({ label, value, description, Icon }) => (
              <StyledSnapshotCard key={label}>
                <StyledCardIcon>
                  <Icon size={16} />
                </StyledCardIcon>
                <div>
                  <StyledMetricValue>{value}</StyledMetricValue>
                  <StyledCardTitle>{label}</StyledCardTitle>
                  <StyledCardDescription>{description}</StyledCardDescription>
                </div>
              </StyledSnapshotCard>
            ))}
          </StyledSnapshotGrid>
        </StyledSection>

        <StyledGrid>
          {(data?.metrics ?? []).map(({ key, label, value, description }) => {
            const Icon = metricIconByKey[key];

            return (
              <StyledMetricCard key={key}>
                <StyledCardIcon>
                  <Icon size={16} />
                </StyledCardIcon>
                <StyledMetricValue>{value.toLocaleString()}</StyledMetricValue>
                <StyledCardTitle>{label}</StyledCardTitle>
                <StyledCardDescription>{description}</StyledCardDescription>
              </StyledMetricCard>
            );
          })}

          {isLoading &&
            data === null &&
            objectLinks.map(({ label, description, Icon }) => (
              <StyledMetricCard key={label}>
                <StyledCardIcon>
                  <Icon size={16} />
                </StyledCardIcon>
                <StyledMetricValue>...</StyledMetricValue>
                <StyledCardTitle>{label}</StyledCardTitle>
                <StyledCardDescription>{description}</StyledCardDescription>
              </StyledMetricCard>
            ))}
        </StyledGrid>

        <StyledGrid>
          {objectLinks.map(({ label, description, to, Icon }) => (
            <StyledObjectLink key={label} to={to}>
              <StyledCardIcon>
                <Icon size={16} />
              </StyledCardIcon>
              <StyledCardTitle>{label}</StyledCardTitle>
              <StyledCardDescription>{description}</StyledCardDescription>
            </StyledObjectLink>
          ))}
        </StyledGrid>

        <StyledTwoColumnGrid>
          <StyledSection>
            <StyledSectionTitle>Recent CRM activity</StyledSectionTitle>
            <StyledPanel>
              {data?.recentActivities.length === 0 && (
                <StyledEmptyState>
                  <StyledPanelPrimary>
                    No CRM audit events have been recorded yet.
                  </StyledPanelPrimary>
                  <StyledPanelSecondary>
                    Activity logging is wired, but no CRM-specific actions or
                    provider callbacks have produced audit entries in this
                    workspace yet.
                  </StyledPanelSecondary>
                </StyledEmptyState>
              )}

              {data?.recentActivities.map((activity) => (
                <StyledPanelRowWithIcon key={activity.id}>
                  <StyledCardIcon>
                    <IconBriefcase size={16} />
                  </StyledCardIcon>
                  <div>
                    <StyledPanelPrimary>{activity.action}</StyledPanelPrimary>
                    <StyledPanelSecondary>
                      {activity.entityType} / {activity.entityId}
                    </StyledPanelSecondary>
                    <StyledPanelMeta>
                      {activity.actorType} / {activity.actorId}
                    </StyledPanelMeta>
                    <StyledPanelMeta>
                      {formatCrmActivityMetadata(activity.metadata)}
                    </StyledPanelMeta>
                  </div>
                  <StyledPanelTrailing>
                    {formatCrmTimestamp(activity.createdAt)}
                  </StyledPanelTrailing>
                </StyledPanelRowWithIcon>
              ))}

              {isLoading && data === null && (
                <StyledEmptyState>Loading activity...</StyledEmptyState>
              )}
            </StyledPanel>
          </StyledSection>

          <StyledSection>
            <StyledSectionTitle>Provider health</StyledSectionTitle>
            <StyledPanel>
              {data?.providerHealth.length === 0 && (
                <StyledEmptyState>
                  <StyledPanelPrimary>
                    No provider webhook events have been received yet.
                  </StyledPanelPrimary>
                  <StyledPanelSecondary>
                    This is expected while API keys and webhook URLs are on
                    hold. The persistence layer is ready, and events will appear
                    here after providers are configured.
                  </StyledPanelSecondary>
                </StyledEmptyState>
              )}

              {data?.providerHealth.map((provider) => (
                <StyledPanelRowWithIcon key={provider.provider}>
                  <StyledCardIcon>
                    <IconMessage size={16} />
                  </StyledCardIcon>
                  <div>
                    <StyledPanelPrimary>{provider.provider}</StyledPanelPrimary>
                    <StyledPanelSecondary>
                      {provider.received} received / {provider.processed}{' '}
                      processed / {provider.failed} failed
                    </StyledPanelSecondary>
                    <StyledPanelMeta>
                      {provider.duplicates} duplicate events ignored
                    </StyledPanelMeta>
                  </div>
                  <StyledPanelTrailing>
                    {formatCrmTimestamp(provider.lastReceivedAt)}
                  </StyledPanelTrailing>
                </StyledPanelRowWithIcon>
              ))}

              {isLoading && data === null && (
                <StyledEmptyState>Loading provider health...</StyledEmptyState>
              )}
            </StyledPanel>
          </StyledSection>
        </StyledTwoColumnGrid>

        <StyledSection>
          <StyledSectionTitle>Launch readiness</StyledSectionTitle>
          <StyledReadinessGrid>
            {readinessGroups.map(({ title, description, items }) => (
              <StyledReadinessGroup key={title}>
                <StyledReadinessGroupHeader>
                  <StyledPanelPrimary>{title}</StyledPanelPrimary>
                  <StyledPanelSecondary>{description}</StyledPanelSecondary>
                </StyledReadinessGroupHeader>
                <StyledReadinessList>
                  {items.map(({ label, state, Icon }) => (
                    <StyledReadinessItem key={label}>
                      <StyledCardIcon>
                        <Icon size={16} />
                      </StyledCardIcon>
                      <StyledCardTitle>{label}</StyledCardTitle>
                      <StyledStatus>{state}</StyledStatus>
                    </StyledReadinessItem>
                  ))}
                </StyledReadinessList>
              </StyledReadinessGroup>
            ))}
          </StyledReadinessGrid>
        </StyledSection>
      </StyledContent>
    </StyledPage>
  );
};
