export const healthProfile = {
  fullName: 'Md Example User',
  dateOfBirth: '29 August 2007',
  gender: 'Male',
  bloodGroup: 'O+',
  mobileNumber: '01XXXXXXXXX',
  emergencyContact: 'Demo Contact',
  placeOfCare: 'Barishal, Bangladesh',
  privacyNote: 'Designed with privacy and secure access in mind.',
}

export const healthSummaryItems = [
  { id: 'records', count: 12, label: 'Medical Records', icon: 'FileText' },
  { id: 'prescriptions', count: 6, label: 'Prescriptions', icon: 'Pill' },
  { id: 'reports', count: 8, label: 'Reports', icon: 'ClipboardList' },
  { id: 'doctorVisits', count: 4, label: 'Doctor Visits', icon: 'Stethoscope' },
  { id: 'hospitalVisits', count: 2, label: 'Hospital Visits', icon: 'Building2' },
  { id: 'vaccinations', count: 7, label: 'Vaccinations', icon: 'ShieldCheck' },
]

export const healthSidebarItems = [
  'Overview',
  'Medical Timeline',
  'Wellness & appointments',
  'Medications',
  'Prescriptions',
  'Reports',
  'Doctor Visits',
  'Hospital Visits',
  'Vaccinations',
  'Documents',
  'Shared with Me',
  'Sharing & Consent',
  'Access History',
]

export const emergencyHealthInfo = {
  bloodGroup: 'O+',
  allergies: ['Penicillin'],
  conditions: ['None recorded'],
  medications: ['Vitamin D (user entered)'],
  emergencyContact: 'Demo Contact',
  source: 'User-provided information',
}

export const timelineEvents = [
  {
    date: '12 Sep 2026',
    type: 'Doctor Visit',
    title: 'General Consultation',
    description: 'Barishal Medical Facility',
    icon: 'Stethoscope',
  },
  {
    date: '08 Aug 2026',
    type: 'Diagnostic Report',
    title: 'Blood Test',
    description: 'Routine sample collection and review log',
    icon: 'ClipboardList',
  },
  {
    date: '21 Jul 2026',
    type: 'Prescription',
    title: 'General Medicine',
    description: 'Prescription record uploaded by user',
    icon: 'Pill',
  },
  {
    date: '04 Jun 2026',
    type: 'Hospital Visit',
    title: 'Follow-up Check',
    description: 'Outpatient visit record for follow-up',
    icon: 'Hospital',
  },
]

export const prescriptions = [
  {
    doctor: 'Dr. Demo Ahmed',
    date: '12 Sep 2026',
    clinic: 'Barishal Medical Facility',
    status: 'Uploaded',
    documentType: 'Prescription',
    statusVariant: 'success',
  },
  {
    doctor: 'Dr. Demo Rahman',
    date: '08 Aug 2026',
    clinic: 'City Care Clinic',
    status: 'Pending Review',
    documentType: 'Prescription',
    statusVariant: 'warning',
  },
  {
    doctor: 'Dr. Demo Nabila',
    date: '21 Jul 2026',
    clinic: 'Dhaka Wellness Center',
    status: 'Demo / Not Verified',
    documentType: 'Prescription',
    statusVariant: 'neutral',
  },
]

export const reports = [
  {
    name: 'CBC Report',
    date: '08 Aug 2026',
    category: 'Lab Reports',
    status: 'Uploaded',
    statusVariant: 'success',
  },
  {
    name: 'X-Ray Review',
    date: '04 Jun 2026',
    category: 'Imaging',
    status: 'Pending Review',
    statusVariant: 'warning',
  },
  {
    name: 'General Diagnostic Summary',
    date: '12 Sep 2026',
    category: 'Diagnostic Reports',
    status: 'Demo',
    statusVariant: 'neutral',
  },
]

export const doctorVisits = [
  {
    doctor: 'Dr. Demo Ahmed',
    specialty: 'Medicine Specialist',
    clinic: 'Barishal Medical Facility',
    date: '12 Sep 2026',
    visitType: 'Follow-up',
    notes: 'Visit notes saved in demo record',
  },
  {
    doctor: 'Dr. Demo Rahman',
    specialty: 'General Physician',
    clinic: 'City Care Clinic',
    date: '08 Aug 2026',
    visitType: 'Consultation',
    notes: 'Sample summary only',
  },
]

export const hospitalVisits = [
  {
    hospital: 'Barishal Medical Facility',
    department: 'Outpatient',
    admissionDate: '02 Sep 2026',
    dischargeDate: '03 Sep 2026',
    visitType: 'Follow-up',
    status: 'Completed',
    statusVariant: 'success',
  },
  {
    hospital: 'City Health Hospital',
    department: 'Diagnostic Wing',
    admissionDate: '04 Jun 2026',
    dischargeDate: '04 Jun 2026',
    visitType: 'Diagnostic',
    status: 'Demo',
    statusVariant: 'neutral',
  },
]

export const vaccinationRecords = [
  {
    name: 'COVID-19 Booster',
    date: '14 Jan 2026',
    dose: 'Booster Dose',
    provider: 'Community Health Center',
    status: 'Recorded',
    statusVariant: 'success',
  },
  {
    name: 'Tetanus',
    date: '18 Mar 2025',
    dose: 'Dose 2',
    provider: 'Local Clinic',
    status: 'Recorded',
    statusVariant: 'success',
  },
  {
    name: 'Hepatitis B',
    date: '30 Nov 2024',
    dose: 'Dose 3',
    provider: 'Regional Health Desk',
    status: 'Demo',
    statusVariant: 'neutral',
  },
]

export const documentCategories = ['All', 'Prescriptions', 'Reports', 'Imaging', 'Vaccination', 'Other']

export const healthDocuments = [
  {
    title: 'Prescription - Sep 2026',
    category: 'Prescriptions',
    date: '12 Sep 2026',
    status: 'Private',
    statusVariant: 'info',
  },
  {
    title: 'CBC Lab Results',
    category: 'Reports',
    date: '08 Aug 2026',
    status: 'Private',
    statusVariant: 'info',
  },
  {
    title: 'Chest X-Ray',
    category: 'Imaging',
    date: '04 Jun 2026',
    status: 'Private',
    statusVariant: 'info',
  },
  {
    title: 'Vaccination Card',
    category: 'Vaccination',
    date: '14 Jan 2026',
    status: 'Private',
    statusVariant: 'info',
  },
]

export const consentEntries = [
  {
    party: 'Dr. Demo Ahmed',
    access: 'Medical Reports',
    granted: '12 Sep 2026',
    expires: '19 Sep 2026',
    status: 'Active',
    statusVariant: 'success',
  },
  {
    party: 'Barishal Medical Facility',
    access: 'Prescription Summary',
    granted: '01 Aug 2026',
    expires: '15 Aug 2026',
    status: 'Expired',
    statusVariant: 'warning',
  },
]

export const accessHistory = [
  {
    provider: 'Doctor Portal',
    action: 'Viewed prescription',
    date: '12 Sep 2026',
    type: 'Doctors',
  },
  {
    provider: 'Hospital System',
    action: 'Accessed medical summary',
    date: '08 Aug 2026',
    type: 'Hospitals',
  },
  {
    provider: 'Diagnostics Platform',
    action: 'Reviewed report metadata',
    date: '04 Jun 2026',
    type: 'Other providers',
  },
]

export const qrData = {
  title: 'Health Profile QR',
  description: 'Only information selected by you can be shared.',
  selectedShareData: ['Blood group', 'Emergency contact', 'Vaccination status'],
}
