import { computed } from 'vue';
import { useLiStore } from '@/stores/LiStore.js';
import { useMainStore } from '@/stores/MainStore.js';

// severities in display order: problems first
const SEVERITIES = ['red', 'yellow', 'green', 'grey'];

// the only place a severity's icon is chosen - a check sets its severity, never its icon
export const SEVERITY_ICONS = {
  red: 'fa-solid fa-circle-exclamation',
  yellow: 'fa-solid fa-circle-minus',
  green: 'fa-solid fa-circle-check',
  grey: 'fa-solid fa-circle-question',
};

// read aloud in place of the icon
export const SEVERITY_LABELS = {
  red: 'Issue',
  yellow: 'Possible issue',
  green: 'OK',
  grey: 'No information',
};

const LI_DEPARTMENT = 'Department of Licenses & Inspections';

// violations.casestatus values for a case that is still in violation
const OPEN_VIOLATION_STATUSES = ['IN VIOLATION', 'IN VIOLATION - COURT'];
// violations.casestatus values 'COMPLIED, BALANCE DUE' and 'SVN ISSUED, BALANCE DUE'
const BALANCE_DUE_STATUS_TEXT = 'BALANCE DUE';
// above this many cases with a balance due, the cases are not listed one by one
const BALANCE_DUE_CASES_LISTED_MAX = 5;
// an expired rental license is shown as a possible issue for this long after its
// expiration date, then as no license at all
const EXPIRED_RENTAL_LICENSE_MONTHS = 3;

const RENTAL_LICENSE_REQUIRED = 'This license is required to legally rent residential units in the city and to collect rent.';
const REPORT_UNLICENSED_RENTALS = 'Report unlicensed rentals or other tenant-landlord issues to 311.';

// Returns the distinct case numbers among the violation rows, in row order
const distinctCaseNumbers = (rows) => [...new Set(rows.map(row => row.casenumber))];

// Returns true if the expiration date is within the last EXPIRED_RENTAL_LICENSE_MONTHS
// (or still in the future, which some 'Expired' licenses have)
const expiredRecently = (expirationDate) => {
  if (!expirationDate) {
    return false;
  }
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - EXPIRED_RENTAL_LICENSE_MONTHS);
  return new Date(expirationDate) >= cutoff;
};

// Returns the open code violations check
const violationsCheck = (violationRows) => {
  if (!violationRows) {
    return { id: 'violations', severity: 'grey', department: LI_DEPARTMENT,
      title: 'Code violation information could not be loaded.', bullets: [] };
  }
  const openCases = distinctCaseNumbers(violationRows.filter(row => OPEN_VIOLATION_STATUSES.includes(row.casestatus)));
  if (openCases.length) {
    return { id: 'violations', severity: 'red', department: LI_DEPARTMENT,
      title: 'This property has active code violations.',
      bullets: [[`${openCases.length} open case${openCases.length > 1 ? 's' : ''}. See the Licenses & Inspections topic for a full list.`]] };
  }
  return { id: 'violations', severity: 'green', department: LI_DEPARTMENT,
    title: 'No active code violations were found for this property.', bullets: [] };
};

// Returns the stop work order check, or null when no permit at the address has the status
// 'Stop Work'. Unlike the other problem-only checks it reports a failed load itself, since
// no other check reads permits
const stopWorkCheck = (stopWorkPermitRows) => {
  if (!stopWorkPermitRows) {
    return { id: 'stop-work', severity: 'grey', department: LI_DEPARTMENT,
      title: 'Stop work order information could not be loaded.', bullets: [] };
  }
  if (!stopWorkPermitRows.length) {
    return null;
  }
  return { id: 'stop-work', severity: 'red', department: LI_DEPARTMENT,
    title: 'This property has an active stop work order.',
    bullets: stopWorkPermitRows.map(permit => [
      'Permit ',
      { text: permit.permitnumber, href: `https://li.phila.gov/Property-History/search/Permit-Detail?address="${encodeURIComponent(permit.address)}"&Id=${permit.permitnumber}` },
      permit.permitdescription ? ` (${permit.permitdescription}) has a stop work order.` : ' has a stop work order.',
    ]) };
};

// Returns the violation balance due check, or null when no case has a balance due. It is
// also null when the violations could not be loaded, since the violations check reports that
const balanceDueCheck = (violationRows, propertyHistoryUrl) => {
  if (!violationRows) {
    return null;
  }
  const cases = distinctCaseNumbers(violationRows.filter(row => row.casestatus && row.casestatus.includes(BALANCE_DUE_STATUS_TEXT)));
  if (!cases.length) {
    return null;
  }
  const caseBullets = cases.length <= BALANCE_DUE_CASES_LISTED_MAX
    ? cases.map(caseNumber => [`Case ${caseNumber} has a balance due.`])
    : [];
  return { id: 'balance-due', severity: 'red', department: LI_DEPARTMENT,
    title: `This property has ${cases.length} violation case${cases.length > 1 ? 's' : ''} with a balance due.`,
    bullets: [
      ...caseBullets,
      ['See these cases at ', { text: 'L&I Property History', href: propertyHistoryUrl }, '.'],
    ] };
};

// Returns the rental license check
const rentalLicenseCheck = (licenseRows) => {
  if (!licenseRows) {
    return { id: 'rental-license', severity: 'grey', department: LI_DEPARTMENT,
      title: 'Rental license information could not be loaded.', bullets: [] };
  }
  const rentalLicenses = licenseRows.filter(row => row.licensetype === 'Rental');
  if (rentalLicenses.some(row => row.licensestatus === 'Active')) {
    return { id: 'rental-license', severity: 'green', department: LI_DEPARTMENT,
      title: 'This property has an active rental license.',
      bullets: [[RENTAL_LICENSE_REQUIRED]] };
  }
  if (rentalLicenses.some(row => row.licensestatus === 'Expired' && expiredRecently(row.expirationdate))) {
    return { id: 'rental-license', severity: 'yellow', department: LI_DEPARTMENT,
      title: 'This property has an expired rental license.',
      bullets: [
        [RENTAL_LICENSE_REQUIRED + ' Renew the license through ', { text: 'eclipse.phila.gov', href: 'https://eclipse.phila.gov/' }, ' or in person to rent this property.'],
        [REPORT_UNLICENSED_RENTALS],
      ] };
  }
  return { id: 'rental-license', severity: 'grey', department: LI_DEPARTMENT,
    title: 'This property does not have an active rental license.',
    bullets: [[RENTAL_LICENSE_REQUIRED], [REPORT_UNLICENSED_RENTALS]] };
};

// Returns the checks for the current address, sorted by severity then department, plus the
// worst severity among them and whether their data is still loading. Each bullet is a list of
// parts: a string is plain text, an object { text, href } is a link
export default function useChecks() {
  const LiStore = useLiStore();
  const MainStore = useMainStore();

  const loading = computed(() => LiStore.loadingLiViolations || LiStore.loadingLiBusinessLicenses || LiStore.loadingLiStopWorkPermits);

  const checks = computed(() => {
    const propertyHistoryUrl = `https://li.phila.gov/Property-History/search?address=${encodeURIComponent(MainStore.currentAddress)}`;
    const violationRows = LiStore.liViolations.rows;
    const all = [
      violationsCheck(violationRows),
      stopWorkCheck(LiStore.liStopWorkPermits.rows),
      balanceDueCheck(violationRows, propertyHistoryUrl),
      rentalLicenseCheck(LiStore.liBusinessLicenses.rows),
    ].filter(check => check);
    return all.sort((a, b) =>
      SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity)
      || a.department.localeCompare(b.department));
  });

  const worstSeverity = computed(() => checks.value[0].severity);

  return { checks, worstSeverity, loading };
}
