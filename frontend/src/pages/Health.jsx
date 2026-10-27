import { Download, HeartPulse, Shield, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import GlassCard from '../components/common/GlassCard'
import AccessHistory from '../components/health/AccessHistory'
import ConsentManager from '../components/health/ConsentManager'
import DoctorVisitCard from '../components/health/DoctorVisitCard'
import DocumentList from '../components/health/DocumentList'
import DocumentUploader from '../components/health/DocumentUploader'
import EmergencyHealthInfo from '../components/health/EmergencyHealthInfo'
import HealthHeader from '../components/health/HealthHeader'
import HealthOverview from '../components/health/HealthOverview'
import HealthSidebar from '../components/health/HealthSidebar'
import HealthSummary from '../components/health/HealthSummary'
import HospitalVisitCard from '../components/health/HospitalVisitCard'
import MedicalReportCard from '../components/health/MedicalReportCard'
import MedicalTimeline from '../components/health/MedicalTimeline'
import MedicationCard from '../components/health/MedicationCard'
import PrescriptionCard from '../components/health/PrescriptionCard'
import QRHealthProfile from '../components/health/QRHealthProfile'
import SharedWithMe from '../components/health/SharedWithMe'
import VaccinationCard from '../components/health/VaccinationCard'
import { useAuth } from '../context/AuthContext'
import {
  deleteTimelineEntry,
  getHealthProfile,
  getHealthTimeline,
  getHealthTimelinePage,
  getMedicalDocuments,
  saveTimelineEntry,
} from '../services/api'
import { healthSidebarItems } from '../data/healthMockData'

function getAge(dateOfBirth) {
  if (!dateOfBirth) return 'Not provided'
  const birthDate = new Date(dateOfBirth)
  if (Number.isNaN(birthDate.getTime())) return 'Not provided'

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  if (
    today.getMonth() < birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) age -= 1
  return age >= 0 ? `${age} years` : 'Not provided'
}

function categorizeHealthRecord(record) {
  const recordType = record.recordType
  if (['MEDICAL_RECORD', 'HEALTH_PROBLEM'].includes(recordType)) return 'records'
  if (recordType === 'PRESCRIPTION') return 'prescriptions'
  if (['REPORT', 'CHECKUP_REPORT'].includes(recordType)) return 'reports'
  if (['DOCTOR_VISIT', 'DOCTOR_CONSULTATION'].includes(recordType)) return 'doctor-visits'
  if (recordType === 'HOSPITAL_VISIT') return 'hospital-visits'
  if (recordType === 'VACCINATION') return 'vaccinations'
  if (recordType === 'CURRENT_MEDICINE') return 'medications'

  switch (record.type) {
    case 'DIAGNOSIS': return 'records'
    case 'MEDICATION': return 'prescriptions'
    case 'VISIT': return 'doctor-visits'
    case 'HOSPITALIZATION': return 'hospital-visits'
    case 'VACCINATION': return 'vaccinations'
    default: return 'records'
  }
}

function EmptyHealthCategory({ label }) {
  return (
    <GlassCard className="p-6 text-center text-slate-300 sm:p-8">
      <p className="text-sm">No {label.toLowerCase()} saved yet.</p>
      <a href="#medical-timeline" className="mt-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
        Add a health record
      </a>
    </GlassCard>
  )
}

function Health() {
  const { accessToken, user } = useAuth()
  const [activeSection, setActiveSection] = useState('overview')
  const [profile, setProfile] = useState(null)
  const [records, setRecords] = useState([])
  const [timelineEvents, setTimelineEvents] = useState([])
  const [timelinePagination, setTimelinePagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [timelinePage, setTimelinePage] = useState(1)
  const [timelineDates, setTimelineDates] = useState({ from: '', to: '' })
  const [timelineLoading, setTimelineLoading] = useState(true)
  const [timelineError, setTimelineError] = useState('')
  const [timelineRefresh, setTimelineRefresh] = useState(0)
  const [documents, setDocuments] = useState([])
  const [sharingRefresh, setSharingRefresh] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadHealthData = async () => {
      try {
        const [profileData, timelineData, documentData] = await Promise.all([
          getHealthProfile(accessToken),
          getHealthTimeline(accessToken),
          getMedicalDocuments(accessToken),
        ])
        if (active) {
          setProfile(profileData)
          setRecords(timelineData)
          setDocuments(documentData)
        }
      } catch (error) {
        console.error('Unable to load health information:', error)
        if (active) {
          setProfile(null)
          setRecords([])
          setDocuments([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadHealthData()
    return () => {
      active = false
    }
  }, [accessToken])

  useEffect(() => {
    let active = true
    setTimelineLoading(true)
    setTimelineError('')

    getHealthTimelinePage(accessToken, {
      page: timelinePage,
      limit: 10,
      ...timelineDates,
    })
      .then(({ timeline, pagination }) => {
        if (!active) return
        setTimelineEvents(timeline)
        setTimelinePagination(pagination)
      })
      .catch((error) => {
        if (active) setTimelineError(error.message)
      })
      .finally(() => {
        if (active) setTimelineLoading(false)
      })

    return () => {
      active = false
    }
  }, [accessToken, timelinePage, timelineDates, timelineRefresh])

  const recordsByCategory = records.reduce((categories, record) => {
    const category = categorizeHealthRecord(record)
    categories[category].push(record)
    return categories
  }, {
    records: [],
    prescriptions: [],
    reports: [],
    'doctor-visits': [],
    'hospital-visits': [],
    vaccinations: [],
    medications: [],
  })
  const prescriptions = recordsByCategory.prescriptions
  const reports = recordsByCategory.reports
  const doctorVisits = recordsByCategory['doctor-visits']
  const hospitalVisits = recordsByCategory['hospital-visits']
  const vaccinationRecords = recordsByCategory.vaccinations
  const recordedMedicines = recordsByCategory.medications
  const medications = recordedMedicines.map((record) => ({
    name: record.title,
    genericName: 'Patient-entered medicine',
    dosage: record.details?.strength || 'Not provided',
    frequency: record.details?.instructions || 'Not provided',
    prescribedBy: record.details?.doctorName || 'Not provided',
    startDate: record.details?.startDate
      ? new Date(record.details.startDate).toLocaleDateString()
      : new Date(record.date).toLocaleDateString(),
    endDate: record.details?.endDate
      ? new Date(record.details.endDate).toLocaleDateString()
      : '',
    status: record.details?.status
      ? `${record.details.status[0]}${record.details.status.slice(1).toLowerCase()}`
      : 'Not provided',
    statusVariant: record.details?.status === 'ACTIVE'
      ? 'success'
      : record.details?.status === 'PAUSED' ? 'warning' : 'neutral',
    key: record.id,
  }))
  const prescriptionCards = prescriptions.map((record) => ({
    name: record.details?.medicine || record.title,
    doctor: record.details?.doctor || 'Not provided',
    clinic: 'Private record',
    date: new Date(record.date).toLocaleDateString(),
    documentType: 'Prescription',
    status: 'Saved',
    statusVariant: 'success',
    key: record.id,
  }))
  const reportCards = reports.map((record) => {
    const fileReference = record.details?.fileReference || ''
    const secureDocument = documents.find((document) => document.id === fileReference)

    return {
      name: record.details?.name || record.title,
      category: record.recordType === 'CHECKUP_REPORT'
        ? 'Patient-entered checkup report'
        : record.details?.type || 'Medical report',
      date: new Date(record.date).toLocaleDateString(),
      result: record.details?.result || '',
      resultContext: [
        record.details?.units ? `Units: ${record.details.units}` : '',
        record.details?.referenceRange ? `Reference range: ${record.details.referenceRange}` : '',
        record.details?.laboratory ? `Laboratory: ${record.details.laboratory}` : '',
      ].filter(Boolean).join(' · '),
      secureFile: secureDocument?.title || '',
      fileReference,
      fileFormat: secureDocument?.format || '',
      status: 'Saved',
      statusVariant: 'success',
      key: record.id,
    }
  })
  const doctorVisitCards = doctorVisits.map((record) => ({
    doctor: record.details?.doctorName || record.details?.doctor || record.title,
    specialty: record.details?.specialty || (record.recordType === 'DOCTOR_CONSULTATION' ? 'Patient-entered consultation' : 'Not provided'),
    date: new Date(record.date).toLocaleDateString(),
    followUpDate: record.details?.followUpDate
      ? new Date(record.details.followUpDate).toLocaleDateString()
      : '',
    clinic: record.details?.clinic || 'Private record',
    visitType: 'Visit',
    notes: [
      record.details?.problem ? `Patient problem: ${record.details.problem}` : '',
      record.details?.counsellingNotes || record.description || '',
    ].filter(Boolean).join('\n') || 'No notes entered',
    key: record.id,
  }))
  const hospitalVisitCards = hospitalVisits.map((record) => ({
    hospital: record.details?.hospital || record.title,
    department: record.details?.department || 'Not provided',
    admissionDate: new Date(record.date).toLocaleDateString(),
    dischargeDate: record.details?.dischargeDate || 'Not provided',
    visitType: 'Visit',
    status: 'Saved',
    statusVariant: 'success',
    key: record.id,
  }))
  const vaccinationCards = vaccinationRecords.map((record) => ({
    name: record.details?.name || record.title,
    provider: record.details?.provider || 'Private record',
    date: new Date(record.date).toLocaleDateString(),
    dose: record.details?.nextDose ? `Next dose: ${new Date(record.details.nextDose).toLocaleDateString()}` : 'Dose date not provided',
    status: 'Complete',
    statusVariant: 'success',
    key: record.id,
  }))

  const displayGender = user?.gender
    ?.toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())

  const healthProfile = profile ? {
    fullName: user?.name || 'My Health',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided',
    age: getAge(user?.dateOfBirth),
    gender: displayGender || 'Not provided',
    district: user?.location?.district || 'Not provided',
    area: user?.location?.area || 'Not provided',
    bloodGroup: profile.bloodGroup || user?.bloodGroup || 'Not provided',
    mobileNumber: user?.phone || 'Not provided',
    emergencyContact: profile.emergencyContact?.name
      ? `${profile.emergencyContact.name} — ${profile.emergencyContact.relationship || 'Contact'} — ${profile.emergencyContact.phone || 'No phone'}`
      : 'Not provided',
    privacyNote: 'Only your authenticated account can access this information.',
    placeOfCare: 'Private care location',
  } : null

  const healthSummaryItems = [
    { id: 'records', target: 'medical-timeline', count: recordsByCategory.records.length, label: 'Health Records', icon: 'FileText' },
    { id: 'prescriptions', target: 'prescriptions', count: prescriptions.length, label: 'Prescriptions', icon: 'Pill' },
    { id: 'reports', target: 'reports', count: reports.length, label: 'Lab & Test Results', icon: 'FlaskConical' },
    { id: 'doctor-visits', target: 'doctor-visits', count: doctorVisits.length, label: 'Doctor Visits', icon: 'Stethoscope' },
    { id: 'hospital-visits', target: 'hospital-visits', count: hospitalVisits.length, label: 'Hospital Care', icon: 'Hospital' },
    { id: 'vaccinations', target: 'vaccinations', count: vaccinationRecords.length, label: 'Vaccinations', icon: 'Syringe' },
    { id: 'medications', target: 'medications', count: recordedMedicines.length, label: 'Current Medications', icon: 'Pill' },
  ]

  const emergencyHealthInfo = {
    emergencyContact: healthProfile?.emergencyContact || 'Not provided',
    allergies: profile?.allergies || [],
    existingConditions: profile?.existingConditions || [],
    currentMedications: profile?.currentMedications || [],
  }

  const qrData = {
    title: 'Health Profile QR',
    description: 'A private, shareable summary of the information stored in your health profile.',
    selectedShareData: ['Basic profile', 'Emergency contact', 'Allergies', 'Existing conditions'],
  }

  const saveTimelineRecord = async (recordId, payload) => {
    const savedRecord = await saveTimelineEntry(accessToken, recordId, payload)
    setRecords((current) => recordId
      ? current.map((record) => record.id === recordId ? savedRecord : record)
      : [savedRecord, ...current])
    if (!recordId) setTimelinePage(1)
    setTimelineRefresh((value) => value + 1)
  }

  const removeTimelineRecord = async (record) => {
    await deleteTimelineEntry(accessToken, record.id)
    setRecords((current) => current.filter((entry) => entry.id !== record.id))
    if (timelineEvents.length === 1 && timelinePage > 1) {
      setTimelinePage((page) => page - 1)
    } else {
      setTimelineRefresh((value) => value + 1)
    }
  }

  const filterTimelineDates = (dates) => {
    setTimelineDates(dates)
    setTimelinePage(1)
  }

  const handleSectionSelect = (sectionKey) => {
    setActiveSection(sectionKey)
    document.getElementById(sectionKey)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const refreshDocuments = async () => {
    try {
      const result = await getMedicalDocuments(accessToken)
      setDocuments(result)
    } catch {
      // The upload has already succeeded; keep the current list visible if refresh fails.
    }
  }

  return (
    <div className="health-page space-y-6 py-4">
      <HealthHeader />

      {loading ? (
        <GlassCard className="p-8 text-center text-slate-300">Loading your private health information…</GlassCard>
      ) : !profile ? (
        <>
          <GlassCard className="p-6 text-center sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100"><HeartPulse size={22} /></div>
            <h2 className="mt-4 text-2xl font-bold text-white">Set up your health information</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">Add your basic information and health records to create a private, personalized health page.</p>
            <Link to="/health/setup" className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-5 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"><HeartPulse size={14} /> Create Health Profile</Link>
          </GlassCard>
          <section id="shared-with-me" className="scroll-mt-24">
            <SharedWithMe accessToken={accessToken} />
          </section>
        </>
      ) : (
      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <div className="xl:sticky xl:top-24 xl:self-start">
          <HealthSidebar items={healthSidebarItems} activeSection={activeSection} onSelect={handleSectionSelect} />
        </div>

        <div className="space-y-6">
          <HealthOverview profile={healthProfile} />
          <EmergencyHealthInfo emergencyInfo={emergencyHealthInfo} />
          <HealthSummary summaryItems={healthSummaryItems} />
          <MedicalTimeline
            events={timelineEvents}
            documents={documents}
            pagination={timelinePagination}
            loading={timelineLoading}
            error={timelineError}
            onSave={saveTimelineRecord}
            onDelete={removeTimelineRecord}
            onPageChange={setTimelinePage}
            onDateFilter={filterTimelineDates}
          />

          <section id="medications" className="scroll-mt-24">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Current medications</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Current medications</h2>
            </div>
            {medications.length === 0 ? (
              <EmptyHealthCategory label="current medications" />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {medications.map((medication) => (
                  <MedicationCard key={medication.key} medication={medication} />
                ))}
              </div>
            )}
          </section>

          <section id="prescriptions" className="scroll-mt-24">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Prescriptions</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Prescriptions</h2>
            </div>
            {prescriptionCards.length === 0 ? <EmptyHealthCategory label="prescriptions" /> : (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {prescriptionCards.map((prescription) => (
                  <PrescriptionCard key={prescription.key} prescription={prescription} />
                ))}
              </div>
            )}
          </section>

          <section id="reports" className="scroll-mt-24">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Medical reports</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Medical reports</h2>
            </div>
            {reportCards.length === 0 ? <EmptyHealthCategory label="lab and test results" /> : (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {reportCards.map((report) => (
                  <MedicalReportCard key={report.key} report={report} />
                ))}
              </div>
            )}
          </section>

          <section id="doctor-visits" className="scroll-mt-24">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Doctor visits</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Doctor visits</h2>
            </div>
            {doctorVisitCards.length === 0 ? <EmptyHealthCategory label="doctor visits" /> : (
              <div className="grid gap-4 lg:grid-cols-2">
                {doctorVisitCards.map((visit) => (
                  <DoctorVisitCard key={visit.key} visit={visit} />
                ))}
              </div>
            )}
          </section>

          <section id="hospital-visits" className="scroll-mt-24">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Hospital visits</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Hospital visits</h2>
            </div>
            {hospitalVisitCards.length === 0 ? <EmptyHealthCategory label="hospital visits" /> : (
              <div className="grid gap-4 lg:grid-cols-2">
                {hospitalVisitCards.map((visit) => (
                  <HospitalVisitCard key={visit.key} visit={visit} />
                ))}
              </div>
            )}
          </section>

          <section id="vaccinations" className="scroll-mt-24">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Vaccination records</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Vaccination records</h2>
            </div>
            {vaccinationCards.length === 0 ? <EmptyHealthCategory label="vaccinations" /> : (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {vaccinationCards.map((vaccination) => (
                  <VaccinationCard key={vaccination.key} vaccination={vaccination} />
                ))}
              </div>
            )}
          </section>

          <section id="documents" className="scroll-mt-24">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Document management</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Health Documents</h2>
            </div>
            <div className="space-y-6">
              <DocumentUploader onUploaded={refreshDocuments} />
              <DocumentList documents={documents} />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <GlassCard className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100">
                  <Download size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Download summary</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Download health summary</h2>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-300">This action is currently a frontend placeholder for a future API-driven health summary export.</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
                <Download size={14} />
                Download Health Summary
              </button>
            </GlassCard>

            <QRHealthProfile qrData={qrData} />
          </div>

          <section id="shared-with-me" className="scroll-mt-24">
            <SharedWithMe accessToken={accessToken} />
          </section>

          <section id="sharing-consent" className="scroll-mt-24">
            <ConsentManager
              accessToken={accessToken}
              records={records}
              documents={documents}
              onSharingChanged={() => setSharingRefresh((current) => current + 1)}
            />
          </section>

          <section id="access-history" className="scroll-mt-24">
            <AccessHistory
              accessToken={accessToken}
              records={records}
              documents={documents}
              refreshKey={sharingRefresh}
            />
          </section>

          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-2 text-emerald-100">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">Privacy center</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Account privacy</h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {['Account privacy', 'Data sharing', 'Consent', 'Access history', 'Security settings'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/20 p-3 text-sm text-slate-200">
                  <div className="mb-2 flex items-center gap-2 text-cyan-100">
                    <Shield size={14} />
                    {item}
                  </div>
                  <p className="text-xs text-slate-400">Demo privacy controls only.</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
      )}
    </div>
  )
}

export default Health
