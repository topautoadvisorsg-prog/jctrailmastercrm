import { AppPath } from 'twenty-shared/types';
import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconCalendar,
  IconLayoutDashboard,
  IconTool,
  IconUsers,
} from 'twenty-ui/display';
import { AnimatedExpandableContainer } from 'twenty-ui/layout';

import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { useNavigationSection } from '@/ui/navigation/navigation-drawer/hooks/useNavigationSection';
import { isNavigationSectionOpenFamilyState } from '@/ui/navigation/navigation-drawer/states/isNavigationSectionOpenFamilyState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useLocation } from 'react-router-dom';

const CRM_SECTION_ID = '21 CRM';

export const NavigationDrawerCrmSection = () => {
  const location = useLocation();
  const { toggleNavigationSection } = useNavigationSection(CRM_SECTION_ID);
  const isNavigationSectionOpen = useAtomFamilyStateValue(
    isNavigationSectionOpenFamilyState,
    CRM_SECTION_ID,
  );

  return (
    <NavigationDrawerSection>
      <NavigationDrawerAnimatedCollapseWrapper>
        <NavigationDrawerSectionTitle
          label="21 CRM"
          onClick={toggleNavigationSection}
          isOpen={isNavigationSectionOpen}
        />
      </NavigationDrawerAnimatedCollapseWrapper>
      <AnimatedExpandableContainer
        isExpanded={isNavigationSectionOpen}
        dimension="height"
        mode="fit-content"
        containAnimation
        initial={false}
      >
        <NavigationDrawerItem
          label="Dashboard"
          to={AppPath.CrmDashboard}
          Icon={IconLayoutDashboard}
          active={location.pathname === AppPath.CrmDashboard}
        />
        <NavigationDrawerItem
          label="Contacts"
          to={AppPath.CrmContacts}
          Icon={IconUsers}
          active={
            location.pathname === AppPath.CrmContacts ||
            location.pathname === AppPath.PeoplePage
          }
        />
        <NavigationDrawerItem
          label="Companies"
          to={AppPath.CrmCompanies}
          Icon={IconBuildingSkyscraper}
          active={
            location.pathname === AppPath.CrmCompanies ||
            location.pathname === AppPath.CompaniesPage
          }
        />
        <NavigationDrawerItem
          label="Deals"
          to={AppPath.CrmDeals}
          Icon={IconBriefcase}
          active={
            location.pathname === AppPath.CrmDeals ||
            location.pathname === AppPath.OpportunitiesPage
          }
        />
        <NavigationDrawerItem
          label="Tasks"
          to={AppPath.CrmTasks}
          Icon={IconCalendar}
          active={
            location.pathname === AppPath.CrmTasks ||
            location.pathname === AppPath.TasksPage
          }
        />
        <NavigationDrawerItem
          label="Work Orders"
          to={AppPath.CrmWorkOrders}
          Icon={IconTool}
          active={
            location.pathname === AppPath.CrmWorkOrders ||
            location.pathname === AppPath.WorkOrdersPage
          }
        />
      </AnimatedExpandableContainer>
    </NavigationDrawerSection>
  );
};
