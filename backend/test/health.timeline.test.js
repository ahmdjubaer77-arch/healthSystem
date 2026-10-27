const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const MedicalTimeline = require('../src/models/MedicalTimeline')
const MedicalDocument = require('../src/models/MedicalDocument')
const healthService = require('../src/services/health.service')
const { cloudinary } = require('../src/config/cloudinary')

const originalMethods = {
  create: MedicalTimeline.create,
  find: MedicalTimeline.find,
  countDocuments: MedicalTimeline.countDocuments,
  findOne: MedicalTimeline.findOne,
  findOneAndUpdate: MedicalTimeline.findOneAndUpdate,
  findOneAndDelete: MedicalTimeline.findOneAndDelete,
  documentFindOne: MedicalDocument.findOne,
  privateDownloadUrl: cloudinary.utils.private_download_url,
  fetch: global.fetch,
}
const originalCloudinaryEnvironment = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
}

after(() => {
  Object.assign(MedicalTimeline, originalMethods)
  MedicalDocument.findOne = originalMethods.documentFindOne
  cloudinary.utils.private_download_url = originalMethods.privateDownloadUrl
  global.fetch = originalMethods.fetch
  if (originalCloudinaryEnvironment.cloudName === undefined) delete process.env.CLOUDINARY_CLOUD_NAME
  else process.env.CLOUDINARY_CLOUD_NAME = originalCloudinaryEnvironment.cloudName
  if (originalCloudinaryEnvironment.apiKey === undefined) delete process.env.CLOUDINARY_API_KEY
  else process.env.CLOUDINARY_API_KEY = originalCloudinaryEnvironment.apiKey
  if (originalCloudinaryEnvironment.apiSecret === undefined) delete process.env.CLOUDINARY_API_SECRET
  else process.env.CLOUDINARY_API_SECRET = originalCloudinaryEnvironment.apiSecret
})

test('validates required patient-entered health problem fields and rejects ownership fields', () => {
  const record = healthService.validateTimelineInput({
    type: 'DIAGNOSIS',
    recordType: 'HEALTH_PROBLEM',
    title: 'Headache',
    description: 'Patient reported a recurring headache.',
    details: { symptoms: 'Headache in the evening' },
    date: '2026-10-20',
  })

  assert.equal(record.recordType, 'HEALTH_PROBLEM')
  assert.equal(record.details.symptoms, 'Headache in the evening')
  assert.throws(
    () => healthService.validateTimelineInput({
      type: 'DIAGNOSIS',
      recordType: 'HEALTH_PROBLEM',
      title: 'Headache',
      description: 'Patient-entered note',
      userId: 'another-patient',
      details: { symptoms: 'Headache' },
      date: '2026-10-20',
    }),
    (error) => error.statusCode === 400,
  )
})

test('validates medicine dates, status, and rejects an end date before the start date', () => {
  const valid = {
    type: 'MEDICATION',
    recordType: 'CURRENT_MEDICINE',
    title: 'Medicine',
    date: '2026-10-01',
    details: {
      strength: '10 mg',
      instructions: 'As entered by patient',
      startDate: '2026-10-01',
      endDate: '2026-10-10',
      status: 'ACTIVE',
      doctorName: 'Dr. Example',
    },
  }
  assert.equal(healthService.validateTimelineInput(valid).details.status, 'ACTIVE')
  assert.throws(
    () => healthService.validateTimelineInput({
      ...valid,
      details: { ...valid.details, endDate: '2026-09-30' },
    }),
    (error) => error.statusCode === 400,
  )
})

test('validates essential details for doctor, hospital, and vaccination records', () => {
  const doctorVisit = healthService.validateTimelineInput({
    type: 'VISIT',
    recordType: 'DOCTOR_VISIT',
    title: 'Visit with Dr. Example',
    date: '2026-10-20',
    details: {
      doctor: 'Dr. Example',
      specialty: 'Cardiology',
      reason: 'Routine checkup',
      followUpDate: '2026-11-20',
    },
  })
  assert.equal(doctorVisit.details.followUpDate, '2026-11-20')

  const hospitalVisit = healthService.validateTimelineInput({
    type: 'HOSPITALIZATION',
    recordType: 'HOSPITAL_VISIT',
    title: 'Visit to Example Hospital',
    date: '2026-10-20',
    details: { hospital: 'Example Hospital', reason: 'Consultation' },
  })
  assert.equal(hospitalVisit.details.hospital, 'Example Hospital')

  const vaccination = healthService.validateTimelineInput({
    type: 'VACCINATION',
    recordType: 'VACCINATION',
    title: 'Influenza vaccine',
    date: '2026-10-20',
    details: {
      name: 'Influenza vaccine',
      dose: '1 of 2',
      provider: 'Example clinic',
      nextDose: '2026-11-20',
    },
  })
  assert.equal(vaccination.details.dose, '1 of 2')
  assert.equal(vaccination.details.provider, 'Example clinic')
  assert.throws(
    () => healthService.validateTimelineInput({
      type: 'VISIT',
      recordType: 'DOCTOR_VISIT',
      title: 'Doctor visit',
      date: '2026-10-20',
      details: { doctor: 'Dr. Example', reason: 'Checkup' },
    }),
    (error) => error.statusCode === 400,
  )
})

test('rejects unsupported details and client-supplied authorship', () => {
  const base = {
    type: 'VISIT',
    recordType: 'DOCTOR_CONSULTATION',
    title: 'Consultation',
    date: '2026-10-20',
    details: { doctorName: 'Dr. Example', clinic: 'Clinic', problem: 'Patient problem' },
  }
  assert.throws(
    () => healthService.validateTimelineInput({ ...base, details: { ...base.details, diagnosis: 'Unsupported' } }),
    (error) => error.statusCode === 400,
  )
  assert.throws(
    () => healthService.validateTimelineInput({ ...base, source: 'CLINICIAN_AUTHORED' }),
    (error) => error.statusCode === 400,
  )
})

test('validates report result fields and date-range pagination', () => {
  const report = healthService.validateTimelineInput({
    type: 'OTHER',
    recordType: 'CHECKUP_REPORT',
    title: 'Blood test',
    date: '2026-10-20',
    details: { result: 'Patient-entered result', units: 'mg/dL', referenceRange: 'Patient-entered reference' },
  })
  assert.equal(report.details.result, 'Patient-entered result')

  const query = healthService.validateTimelineQuery({
    page: '2',
    limit: '10',
    from: '2026-10-01',
    to: '2026-10-31',
  })
  assert.equal(query.page, 2)
  assert.equal(query.limit, 10)
  assert.equal(query.dateQuery.$lte.toISOString(), '2026-10-31T23:59:59.999Z')
  assert.throws(
    () => healthService.validateTimelineQuery({ page: '0' }),
    (error) => error.statusCode === 400,
  )
  assert.throws(
    () => healthService.validateTimelineQuery({ from: '2026-10-31', to: '2026-10-01' }),
    (error) => error.statusCode === 400,
  )
})

test('scopes timeline updates to the authenticated patient', async () => {
  let query
  MedicalTimeline.findOne = async (filter) => {
    query = filter
    return null
  }

  await assert.rejects(
    healthService.updateTimelineEntry('65a000000000000000000001', '65a000000000000000000002', {
      title: 'Edited consultation',
    }),
    (error) => error.statusCode === 404,
  )
  assert.deepEqual(query, {
    _id: '65a000000000000000000002',
    user: '65a000000000000000000001',
  })
})

test('validates partial timeline edits against the complete owned record', async () => {
  const entryId = '65a000000000000000000007'
  let update
  MedicalTimeline.findOne = async (filter) => {
    assert.deepEqual(filter, { _id: entryId, user: '65a000000000000000000001' })
    return {
      _id: { toString: () => entryId },
      user: '65a000000000000000000001',
      type: 'OTHER',
      recordType: 'HEALTH_PROBLEM',
      title: 'Patient-entered problem',
      description: 'Patient-entered description',
      details: { symptoms: 'Earlier symptoms' },
      date: new Date('2026-10-10T00:00:00.000Z'),
    }
  }
  MedicalTimeline.findOneAndUpdate = async (filter, change) => {
    update = { filter, fields: change.$set }
    return {
      _id: { toString: () => entryId },
      ...change.$set,
    }
  }

  const result = await healthService.updateTimelineEntry(
    '65a000000000000000000001',
    entryId,
    { details: { symptoms: 'Updated symptoms' } },
  )

  assert.equal(update.fields.title, 'Patient-entered problem')
  assert.equal(update.fields.description, 'Patient-entered description')
  assert.equal(update.fields.details.symptoms, 'Updated symptoms')
  assert.deepEqual(update.filter, { _id: entryId, user: '65a000000000000000000001' })
  assert.equal(result.source, 'PATIENT_ENTERED')
})

test('scopes timeline listing to the authenticated patient with pagination and date filters', async () => {
  let filter
  let skip
  let limit
  const entry = {
    _id: { toString: () => '65a000000000000000000003' },
    type: 'OTHER',
    recordType: 'HEALTH_PROBLEM',
    source: 'PATIENT_ENTERED',
    title: 'Patient-entered problem',
    description: 'Patient-entered description',
    details: { symptoms: 'Patient-entered symptoms' },
    date: new Date('2026-10-10T00:00:00.000Z'),
  }
  MedicalTimeline.find = (query) => {
    filter = query
    return {
      sort() { return this },
      skip(value) { skip = value; return this },
      async limit(value) { limit = value; return [entry] },
    }
  }
  MedicalTimeline.countDocuments = async (query) => {
    assert.deepEqual(query, filter)
    return 21
  }

  const result = await healthService.getTimeline('65a000000000000000000001', {
    page: '2',
    limit: '10',
    from: '2026-10-01',
    to: '2026-10-31',
  })

  assert.equal(filter.user, '65a000000000000000000001')
  assert.equal(filter.date.$gte.toISOString(), '2026-10-01T00:00:00.000Z')
  assert.equal(filter.date.$lte.toISOString(), '2026-10-31T23:59:59.999Z')
  assert.equal(skip, 10)
  assert.equal(limit, 10)
  assert.equal(result.timeline[0].source, 'PATIENT_ENTERED')
  assert.deepEqual(result.pagination, { page: 2, limit: 10, total: 21, totalPages: 3 })
})

test('scopes timeline deletes to the authenticated patient', async () => {
  let query
  MedicalTimeline.findOneAndDelete = async (filter) => {
    query = filter
    return null
  }

  await assert.rejects(
    healthService.deleteTimelineEntry('65a000000000000000000001', '65a000000000000000000004'),
    (error) => error.statusCode === 404,
  )
  assert.deepEqual(query, {
    _id: '65a000000000000000000004',
    user: '65a000000000000000000001',
  })
})

test('accepts valid WebP uploads and rejects invalid or unsupported file types', () => {
  const webpBytes = Buffer.from('RIFF0000WEBP')
  assert.equal(healthService.validateMedicalFile({
    buffer: webpBytes,
    size: webpBytes.length,
    originalname: 'report.webp',
    mimetype: 'image/webp',
  }).format, 'webp')

  assert.throws(
    () => healthService.validateMedicalFile({
      buffer: Buffer.from('not an image'),
      size: 12,
      originalname: 'report.png',
      mimetype: 'image/png',
    }),
    (error) => error.statusCode === 400,
  )
  assert.throws(
    () => healthService.validateMedicalFile({
      buffer: Buffer.from('invalid'),
      size: 7,
      originalname: 'report.svg',
      mimetype: 'image/svg+xml',
    }),
    (error) => error.statusCode === 400,
  )
})

test('retrieves private medical document content only for its authenticated owner', async () => {
  const documentId = '65a000000000000000000008'
  const userId = '65a000000000000000000001'
  let query
  let signedUrlRequested = false
  MedicalDocument.findOne = async (filter) => {
    query = filter
    return null
  }
  cloudinary.utils.private_download_url = () => {
    signedUrlRequested = true
    return 'https://storage.example/private-report'
  }

  await assert.rejects(
    healthService.getMedicalDocumentContent(userId, documentId),
    (error) => error.statusCode === 404,
  )
  assert.deepEqual(query, { _id: documentId, user: userId })
  assert.equal(signedUrlRequested, false)
})

test('streams authenticated report bytes with the stored file type and reports missing storage files', async () => {
  const documentId = '65a000000000000000000009'
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
  process.env.CLOUDINARY_API_KEY = 'test-key'
  process.env.CLOUDINARY_API_SECRET = 'test-secret'
  let signedOptions
  MedicalDocument.findOne = async (filter) => {
    assert.deepEqual(filter, {
      _id: documentId,
      user: '65a000000000000000000001',
    })
    return {
      cloudinaryPublicId: 'private/report-id',
      resourceType: 'image',
      format: 'png',
      originalFileName: 'report.png',
    }
  }
  cloudinary.utils.private_download_url = (publicId, format, options) => {
    assert.equal(publicId, 'private/report-id')
    assert.equal(format, 'png')
    signedOptions = options
    return 'https://storage.example/private-report'
  }
  global.fetch = async () => ({
    ok: true,
    status: 200,
    arrayBuffer: async () => Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  })

  const file = await healthService.getMedicalDocumentContent(
    '65a000000000000000000001',
    documentId,
  )
  assert.equal(file.contentType, 'image/png')
  assert.deepEqual(file.buffer, Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  assert.equal(file.fileName, 'report.png')
  assert.equal(signedOptions.type, 'authenticated')
  assert.equal(signedOptions.resource_type, 'image')

  global.fetch = async () => ({ ok: false, status: 404 })
  await assert.rejects(
    healthService.getMedicalDocumentContent('65a000000000000000000001', documentId),
    (error) => error.statusCode === 404,
  )
})

test('creates entries with the authenticated owner and server-assigned patient authorship', async () => {
  let created
  MedicalTimeline.create = async (fields) => {
    created = fields
    return {
      _id: { toString: () => '65a000000000000000000005' },
      ...fields,
      createdAt: new Date('2026-10-20T00:00:00.000Z'),
      updatedAt: new Date('2026-10-20T00:00:00.000Z'),
    }
  }
  const record = await healthService.createTimelineEntry('65a000000000000000000001', {
    type: 'OTHER',
    recordType: 'HEALTH_PROBLEM',
    title: 'Patient-entered problem',
    description: 'Patient-entered description',
    details: { symptoms: 'Patient-entered symptoms' },
    date: '2026-10-20',
  })

  assert.equal(created.user, '65a000000000000000000001')
  assert.equal(created.source, 'PATIENT_ENTERED')
  assert.equal(record.source, 'PATIENT_ENTERED')
})

test('only links a checkup report to a medical document owned by the authenticated patient', async () => {
  let documentFilter
  MedicalDocument.findOne = (filter) => {
    documentFilter = filter
    return { select: async () => null }
  }

  await assert.rejects(
    healthService.createTimelineEntry('65a000000000000000000001', {
      type: 'OTHER',
      recordType: 'CHECKUP_REPORT',
      title: 'Patient-entered test name',
      date: '2026-10-20',
      details: {
        result: 'Patient-entered result',
        fileReference: '65a000000000000000000006',
      },
    }),
    (error) => error.statusCode === 404,
  )
  assert.deepEqual(documentFilter, {
    _id: '65a000000000000000000006',
    user: '65a000000000000000000001',
  })
})
