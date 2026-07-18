import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import {
  IconArrowRight,
  IconDatabase,
  IconLayoutDashboard,
  IconRefresh,
} from 'twenty-ui/display';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';

import {
  crmModuleConfigs,
  type CrmModuleKey,
} from './constants/crmModuleConfigs';
import { useCrmDashboardData } from './hooks/useCrmDashboardData';
import { formatCrmFreshness } from './utils/crmDashboardFormatters';

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

const StyledHeader = styled.header`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 1fr auto;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: 1fr;
  }
`;

const StyledHeaderText = styled.div`
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
  max-width: 760px;
`;

const StyledBackLink = styled(Link)`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  display: inline-flex;
  gap: ${themeCssVariables.spacing[2]};
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[3]};
  text-decoration: none;
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

const StyledHeaderButtonRow = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    flex-wrap: wrap;
  }
`;

const StyledRefreshButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: inline-flex;
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

const StyledSummaryGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const StyledMetricPanel = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 176px;
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledMetricValue = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: 40px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0;
  line-height: 46px;
`;

const StyledPanelLabel = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledPanelDescription = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 20px;
`;

const StyledActionGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: 1fr;
  }
`;

const StyledActionCard = styled(Link)`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: ${themeCssVariables.spacing[7]} 1fr auto;
  min-height: 104px;
  padding: ${themeCssVariables.spacing[4]};
  text-decoration: none;

  &:hover {
    border-color: ${themeCssVariables.border.color.medium};
  }

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: ${themeCssVariables.spacing[7]} 1fr;
  }
`;

const StyledIconBox = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  height: ${themeCssVariables.spacing[7]};
  justify-content: center;
  width: ${themeCssVariables.spacing[7]};
`;

const StyledChecklist = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledSectionTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0;
  margin: 0;
`;

const StyledFocusGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

const StyledFocusCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-height: 104px;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledDataNotice = styled.div`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  line-height: 20px;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHandoffPanel = styled(Link)`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: ${themeCssVariables.spacing[7]} 1fr auto;
  min-height: 72px;
  padding: ${themeCssVariables.spacing[4]};
  text-decoration: none;

  &:hover {
    border-color: ${themeCssVariables.border.color.medium};
  }

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: ${themeCssVariables.spacing[7]} 1fr;
  }
`;

const StyledActionArrow = styled(IconArrowRight)`
  justify-self: end;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-column: 2;
    justify-self: start;
  }
`;

const StyledChecklistRow = styled.div`
  align-items: center;
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 1fr auto;
  min-height: 52px;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};

  & + & {
    border-top: 1px solid ${themeCssVariables.border.color.light};
  }

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    grid-template-columns: 1fr;
  }
`;

const StyledStatus = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  white-space: nowrap;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    white-space: normal;
  }
`;

const isCrmModuleKey = (value: string | undefined): value is CrmModuleKey =>
  value === 'contacts' ||
  value === 'companies' ||
  value === 'deals' ||
  value === 'tasks';

export const CrmModulePage = () => {
  const { moduleKey } = useParams();
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const { data, error, isLoading, refetch } = useCrmDashboardData({
    metadataVersion: currentWorkspace?.metadataVersion,
  });

  if (!isCrmModuleKey(moduleKey)) {
    return <Navigate to={AppPath.CrmDashboard} replace />;
  }

  const moduleConfig = crmModuleConfigs[moduleKey];
  const metric = data?.metrics.find(
    (currentMetric) => currentMetric.key === moduleConfig.metricKey,
  );
  const ModuleIcon = moduleConfig.Icon;

  return (
    <StyledPage>
      <StyledContent>
        <StyledHeader>
          <StyledHeaderText>
            <StyledEyebrow>
              {currentWorkspace?.displayName ?? 'Workspace'} / 21 CRM /{' '}
              {moduleConfig.label}
            </StyledEyebrow>
            <StyledTitle>{moduleConfig.title}</StyledTitle>
            <StyledSubtitle>{moduleConfig.description}</StyledSubtitle>
          </StyledHeaderText>
          <StyledHeaderActions>
            <StyledHeaderButtonRow>
              <StyledRefreshButton disabled={isLoading} onClick={refetch}>
                <IconRefresh size={14} />
                Refresh
              </StyledRefreshButton>
              <StyledBackLink to={AppPath.CrmDashboard}>
                <IconLayoutDashboard size={14} />
                Dashboard
              </StyledBackLink>
            </StyledHeaderButtonRow>
            <StyledFreshness>
              {formatCrmFreshness(data?.generatedAt)}
            </StyledFreshness>
          </StyledHeaderActions>
        </StyledHeader>

        {error !== null && (
          <StyledDataNotice>
            <StyledPanelLabel>Live CRM data is unavailable.</StyledPanelLabel>
            <StyledPanelDescription>
              {error.message}. You can still open the underlying Twenty records
              and continue working.
            </StyledPanelDescription>
          </StyledDataNotice>
        )}

        <StyledSummaryGrid>
          <StyledMetricPanel>
            <StyledIconBox>
              <ModuleIcon size={16} />
            </StyledIconBox>
            <StyledMetricValue>
              {metric?.value.toLocaleString() ?? (isLoading ? '...' : '0')}
            </StyledMetricValue>
            <StyledPanelLabel>{moduleConfig.label}</StyledPanelLabel>
            <StyledPanelDescription>
              {metric?.description ??
                'Live count loads from the CRM dashboard endpoint.'}
            </StyledPanelDescription>
          </StyledMetricPanel>

          <StyledActionGrid>
            {moduleConfig.primaryActions.map(
              ({ label, description, to, Icon }) => (
                <StyledActionCard key={label} to={to}>
                  <StyledIconBox>
                    <Icon size={16} />
                  </StyledIconBox>
                  <div>
                    <StyledPanelLabel>{label}</StyledPanelLabel>
                    <StyledPanelDescription>
                      {description}
                    </StyledPanelDescription>
                  </div>
                  <StyledActionArrow size={16} />
                </StyledActionCard>
              ),
            )}
          </StyledActionGrid>
        </StyledSummaryGrid>

        <StyledHandoffPanel to={moduleConfig.objectPath}>
          <StyledIconBox>
            <IconDatabase size={16} />
          </StyledIconBox>
          <div>
            <StyledPanelLabel>
              Twenty records are the source of truth
            </StyledPanelLabel>
            <StyledPanelDescription>
              This 21 CRM page adds workflow context, while create, edit,
              import, export, filters, and saved views stay in the native object
              workspace.
            </StyledPanelDescription>
          </div>
          <StyledActionArrow size={16} />
        </StyledHandoffPanel>

        <StyledSection>
          <StyledSectionTitle>Operational focus</StyledSectionTitle>
          <StyledFocusGrid>
            {moduleConfig.focusAreas.map(({ label, description }) => (
              <StyledFocusCard key={label}>
                <StyledPanelLabel>{label}</StyledPanelLabel>
                <StyledPanelDescription>{description}</StyledPanelDescription>
              </StyledFocusCard>
            ))}
          </StyledFocusGrid>
        </StyledSection>

        <StyledSection>
          <StyledSectionTitle>Readiness checks</StyledSectionTitle>
          <StyledChecklist>
            {moduleConfig.operatingChecklist.map(({ label, state }) => (
              <StyledChecklistRow key={label}>
                <StyledPanelLabel>{label}</StyledPanelLabel>
                <StyledStatus>{state}</StyledStatus>
              </StyledChecklistRow>
            ))}
          </StyledChecklist>
        </StyledSection>
      </StyledContent>
    </StyledPage>
  );
};
