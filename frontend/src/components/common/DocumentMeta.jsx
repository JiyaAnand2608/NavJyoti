import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeMetadata = [
  {
    pattern: /^\/$/,
    title: 'NavJyoti — Healthy Children, Brighter Tomorrows',
    description: 'Dedicated child development & immunisation support platform for children aged 0–5, ensuring continuous healthcare during migration.',
  },
  {
    pattern: /^\/records\/lookup/,
    title: 'Health Pass Verification | NavJyoti',
    description: 'Verify child UIP vaccination records and health pass status offline or in transit.',
  },
  {
    pattern: /^\/auth\/select-role/,
    title: 'Choose Portal | NavJyoti',
    description: 'Select whether to access the Parent Caregiver Portal or the Healthcare Worker Portal.',
  },
  {
    pattern: /^\/auth\/login/,
    title: 'Secure Login | NavJyoti',
    description: 'Sign in to your NavJyoti caregiver or health worker account with multi-factor authentication.',
  },
  {
    pattern: /^\/auth\/register/,
    title: 'Register Beneficiary | NavJyoti',
    description: 'Register a child or caregiver into the NavJyoti maternal and child health support system.',
  },
  {
    pattern: /^\/auth\/jurisdiction/,
    title: 'Jurisdiction Verification | NavJyoti',
    description: 'Verify healthcare worker posting, sub-centre jurisdiction, and sector credentials.',
  },
  {
    pattern: /^\/parent\/dashboard/,
    title: 'Caregiver Dashboard | NavJyoti',
    description: 'Track child vaccination schedule, upcoming health visits, and developmental milestones.',
  },
  {
    pattern: /^\/parent\/children/,
    title: 'My Children Profiles | NavJyoti',
    description: 'Manage registered children, view age progress, and update family health details.',
  },
  {
    pattern: /^\/parent\/vaccines/,
    title: 'UIP Vaccination Tracker | NavJyoti',
    description: 'Monitor Universal Immunisation Programme vaccine doses, due dates, and protection status.',
  },
  {
    pattern: /^\/parent\/milestones/,
    title: 'Developmental Milestones | NavJyoti',
    description: 'Engage in natural milestone observations for motor, speech, and cognitive progress (Ages 0–5).',
  },
  {
    pattern: /^\/parent\/records/,
    title: 'Digital Health Records & Passes | NavJyoti',
    description: 'Access portable offline QR passes, vaccination history certificates, and clinic documents.',
  },
  {
    pattern: /^\/parent\/reminders/,
    title: 'Health Reminders & Notifications | NavJyoti',
    description: 'View upcoming dose notifications, Village Health & Nutrition Day session dates, and worker alerts.',
  },
  {
    pattern: /^\/parent\/appointments/,
    title: 'Health Visits & ANM Appointments | NavJyoti',
    description: 'Schedule health visits and consultations with your assigned village ANM and ASHA workers.',
  },
  {
    pattern: /^\/parent\/help/,
    title: 'Help Centre & Support | NavJyoti',
    description: 'UIP guidelines, national helplines, FAQ library, and direct healthcare worker communication.',
  },
  {
    pattern: /^\/parent\/profile/,
    title: 'Parent Profile & Preferences | NavJyoti',
    description: 'Manage your contact information, preferred language, and health centre assignment.',
  },
  {
    pattern: /^\/worker\/dashboard/,
    title: 'Frontline Worker Dashboard | NavJyoti',
    description: 'Overview of village cohort immunisation coverage, overdue doses, and scheduled clinic sessions.',
  },
  {
    pattern: /^\/worker\/registry/,
    title: 'Child Beneficiary Registry | NavJyoti',
    description: 'Search and manage enrolled children across assigned village sub-centres and sectors.',
  },
  {
    pattern: /^\/worker\/children/,
    title: 'Child Health Record | NavJyoti',
    description: 'Detailed UIP vaccination history, growth parameters, and caregiver contacts for beneficiary child.',
  },
  {
    pattern: /^\/worker\/vaccinations/,
    title: 'Immunisation Management | NavJyoti',
    description: 'Administer UIP vaccine doses, record batch numbers, and verify cold chain compliance.',
  },
  {
    pattern: /^\/worker\/priority/,
    title: 'Priority & Overdue Follow-ups | NavJyoti',
    description: 'Track red and amber high-risk children requiring urgent home visits or catch-up immunisation.',
  },
  {
    pattern: /^\/worker\/appointments/,
    title: 'Session & Visit Appointments | NavJyoti',
    description: 'Review caregiver appointment requests and organise Wednesday VHND village clinics.',
  },
  {
    pattern: /^\/worker\/messages/,
    title: 'Caregiver Communication Center | NavJyoti',
    description: 'Dispatch targeted bilingual SMS notifications and immunisation reminders to parents.',
  },
  {
    pattern: /^\/worker\/qr-handoff/,
    title: 'Migrant QR Transfer & Handoff | NavJyoti',
    description: 'Generate seamless digital transfer passes for migrant families moving across state borders.',
  },
  {
    pattern: /^\/worker\/profile/,
    title: 'Healthcare Worker Profile | NavJyoti',
    description: 'Manage worker credentials, assigned sub-centre details, and jurisdiction settings.',
  },
  {
    pattern: /^\/supervisor\/analytics/,
    title: 'Supervisor Coverage Analytics | NavJyoti',
    description: 'District and block-level immunisation indicators, cohort dropouts, and sector performance.',
  },
];

export function DocumentMeta() {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    const match = routeMetadata.find((item) => item.pattern.test(currentPath));

    if (match) {
      document.title = match.title;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', match.description);
    } else {
      document.title = 'Page Not Found | NavJyoti';
    }
  }, [location.pathname]);

  return null;
}
