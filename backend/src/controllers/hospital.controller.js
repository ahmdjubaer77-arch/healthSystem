const mongoose = require('mongoose')
const NearbyHospital = require('../models/NearbyHospital')
const Provider = require('../models/Provider')
const User = require('../models/User')

const QUICK_ACCESS_CATEGORIES = new Set(['hospitals', 'blood', 'doctors', 'ambulance'])

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function publicHospitalResponse(hospital) {
  return {
    id: hospital._id.toString(),
    name: hospital.name,
    address: hospital.address || '',
    phone: hospital.contactPhone || '',
    division: hospital.division || '',
    district: hospital.district || '',
    upazila: hospital.upazila || '',
    verificationStatus: hospital.verificationStatus,
  }
}

async function getPublicLocationOptions(req, res, next) {
  try {
    const { category } = req.query
    if (typeof category !== 'string' || !QUICK_ACCESS_CATEGORIES.has(category)) {
      return res.status(400).json({ success: false, message: 'A valid Quick Access category is required.' })
    }
    const parentFilters = {}
    for (const field of ['division', 'district', 'upazila']) {
      const value = req.query[field]
      if (value === undefined || value === '') continue
      if (typeof value !== 'string' || value.trim().length > 120) {
        return res.status(400).json({ success: false, message: `Invalid ${field} filter.` })
      }
      parentFilters[field] = value.trim()
    }

    const isBlood = category === 'blood'
    const locationPath = isBlood ? (field) => `location.${field}` : (field) => field
    const source = isBlood ? User : Provider
    const filter = isBlood
      ? { role: 'BLOOD_DONOR', accountStatus: 'ACTIVE', donorVerificationStatus: 'VERIFIED' }
      : category === 'hospitals'
        ? { providerType: 'Hospital', verificationStatus: 'VERIFIED' }
        : category === 'doctors'
          ? { providerType: 'Doctor', verificationStatus: 'VERIFIED', operationalStatus: { $in: ['AVAILABLE', 'BUSY'] } }
          : { providerType: 'Ambulance Provider', verificationStatus: 'VERIFIED', operationalStatus: { $in: ['AVAILABLE', 'BUSY'] }, contactPhone: { $regex: '^\\+?[0-9][0-9\\s()-]{6,29}$' } }

    for (const [field, value] of Object.entries(parentFilters)) filter[locationPath(field)] = value
    const [divisions, districts, upazilas, areas] = await Promise.all([
      source.distinct(locationPath('division'), isBlood ? { role: filter.role, accountStatus: filter.accountStatus, donorVerificationStatus: filter.donorVerificationStatus } : Object.fromEntries(Object.entries(filter).filter(([field]) => !['division', 'district', 'upazila'].includes(field)))),
      parentFilters.division ? source.distinct(locationPath('district'), filter) : [],
      parentFilters.division && parentFilters.district ? source.distinct(locationPath('upazila'), filter) : [],
      category === 'ambulance' && parentFilters.division && parentFilters.district && parentFilters.upazila
        ? Provider.distinct('serviceAreas', filter)
        : [],
    ])

    const clean = (values) => values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()).sort((left, right) => left.localeCompare(right))
    res.status(200).json({ success: true, message: 'Location options retrieved successfully.', data: {
      divisions: clean(divisions), districts: clean(districts), upazilas: clean(upazilas), areas: clean(areas),
    } })
  } catch (error) {
    next(error)
  }
}

async function getPublicHospitals(req, res, next) {
  try {
    const page = req.query.page === undefined ? 1 : Number(req.query.page)
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit)
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: 'Invalid pagination values.' })
    }

    const filter = { providerType: 'Hospital', verificationStatus: 'VERIFIED' }
    for (const field of ['division', 'district', 'upazila']) {
      const value = req.query[field]
      if (value === undefined || value === '') continue
      if (typeof value !== 'string' || value.trim().length > 120) {
        return res.status(400).json({ success: false, message: `Invalid ${field} filter.` })
      }
      if (value.trim()) filter[field] = { $regex: escapeRegex(value.trim()), $options: 'i' }
    }

    const searchValue = req.query.search
    if (searchValue !== undefined && searchValue !== '') {
      if (typeof searchValue !== 'string' || searchValue.trim().length > 120) {
        return res.status(400).json({ success: false, message: 'Invalid search value.' })
      }
      const search = searchValue.trim()
      if (search) {
        const pattern = { $regex: escapeRegex(search), $options: 'i' }
        filter.$and = [{ $or: [
          { name: pattern },
          { address: pattern },
          { division: pattern },
          { district: pattern },
          { upazila: pattern },
        ] }]
      }
    }

    const [hospitals, total] = await Promise.all([
      Provider.find(filter)
        .select('name address contactPhone division district upazila verificationStatus')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Provider.countDocuments(filter),
    ])

    res.status(200).json({
      success: true,
      message: 'Hospitals retrieved successfully',
      data: {
        hospitals: hospitals.map(publicHospitalResponse),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    next(error)
  }
}

async function getNearbyHospital(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' })
    }

    if (req.query.lat === undefined && req.query.lng === undefined) {
      const hospital = await Provider.findOne({ _id: req.params.id, providerType: 'Hospital', verificationStatus: 'VERIFIED' })
        .select('name address contactPhone division district upazila verificationStatus')
        .lean()
      if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found.' })
      return res.status(200).json({
        success: true,
        message: 'Hospital retrieved successfully',
        data: { hospital: publicHospitalResponse(hospital) },
      })
    }

    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required.' })
    }

    const hospital = await NearbyHospital.findById(req.params.id, {
      name: 1,
      address: 1,
      phone: 1,
      type: 1,
      services: 1,
      emergencyAvailable: 1,
      operatingStatus: 1,
      verificationStatus: 1,
      location: 1,
      lastUpdated: 1,
    }).lean()

    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found.' })

    const [longitude, latitude] = hospital.location.coordinates
    const earthRadiusKm = 6371
    const latDifference = (latitude - lat) * (Math.PI / 180)
    const lngDifference = (longitude - lng) * (Math.PI / 180)
    const latOne = lat * (Math.PI / 180)
    const latTwo = latitude * (Math.PI / 180)
    const haversine =
      Math.sin(latDifference / 2) ** 2 +
      Math.cos(latOne) * Math.cos(latTwo) * Math.sin(lngDifference / 2) ** 2
    const distanceKm = earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))

    return res.status(200).json({
      success: true,
      message: 'Nearby healthcare facility retrieved successfully.',
      data: {
        hospital: {
          id: hospital._id.toString(),
          name: hospital.name,
          address: hospital.address,
          phone: hospital.phone,
          type: hospital.type,
          services: hospital.services || [],
          emergencyAvailable: Boolean(hospital.emergencyAvailable),
          operatingStatus: hospital.operatingStatus,
          verificationStatus: hospital.verificationStatus,
          coordinates: { latitude, longitude },
          distanceKm,
          lastUpdated: hospital.lastUpdated,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

async function getNearbyHospitals(req, res, next) {
  try {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    const radius = Number(req.query.radius || 10)
    const searchTerm = String(req.query.q || '').trim()

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required.' })
    }

    if (!Number.isFinite(radius) || radius <= 0 || radius > 100) {
      return res.status(400).json({ success: false, message: 'Radius must be between 0 and 100 kilometers.' })
    }

    const query = {
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius * 1000,
        },
      },
    }

    if (searchTerm) {
      const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const searchPattern = new RegExp(escapedSearchTerm, 'i')
      query.$or = [
        { name: searchPattern },
        { address: searchPattern },
        { area: searchPattern },
        { services: searchPattern },
      ]
    }

    const hospitals = await NearbyHospital.find(query, {
      name: 1,
      address: 1,
      area: 1,
      phone: 1,
      type: 1,
      services: 1,
      emergencyAvailable: 1,
      operatingStatus: 1,
      verificationStatus: 1,
      location: 1,
      lastUpdated: 1,
    }).lean()

    const results = hospitals.map((hospital) => {
      const [longitude, latitude] = hospital.location.coordinates
      const earthRadiusKm = 6371
      const latDifference = (latitude - lat) * (Math.PI / 180)
      const lngDifference = (longitude - lng) * (Math.PI / 180)
      const latOne = lat * (Math.PI / 180)
      const latTwo = latitude * (Math.PI / 180)
      const haversine =
        Math.sin(latDifference / 2) ** 2 +
        Math.cos(latOne) * Math.cos(latTwo) * Math.sin(lngDifference / 2) ** 2
      const distanceKm = earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))

      return {
        id: hospital._id.toString(),
        name: hospital.name,
        address: hospital.address,
        area: hospital.area || '',
        phone: hospital.phone,
        type: hospital.type,
        services: hospital.services || [],
        emergencyAvailable: Boolean(hospital.emergencyAvailable),
        operatingStatus: hospital.operatingStatus,
        verificationStatus: hospital.verificationStatus,
        coordinates: { latitude, longitude },
        distanceKm,
        lastUpdated: hospital.lastUpdated,
      }
    })

    results.sort((first, second) => first.distanceKm - second.distanceKm)

    return res.status(200).json({
      success: true,
      message: 'Nearby healthcare facilities retrieved successfully.',
      data: { hospitals: results },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getPublicHospitals, getNearbyHospital, getNearbyHospitals, getPublicLocationOptions }
