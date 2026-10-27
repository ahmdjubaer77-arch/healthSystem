import {
  Activity,
  Ambulance,
  Bath,
  Building2,
  Droplets,
  HeartPulse,
  House,
  ShieldAlert,
  Stethoscope,
  UserRound,
  Syringe,
  BriefcaseMedical,
} from 'lucide-react'

export const navItems = [
  { translationKey: 'home', path: '/', icon: House },
  { translationKey: 'health', path: '/health', icon: HeartPulse },
  { translationKey: 'emergency', path: '/emergency', icon: ShieldAlert, highlight: true },
  { translationKey: 'blood', path: '/blood', icon: Droplets },
  { translationKey: 'hospitals', path: '/hospitals', icon: Building2 },
  { translationKey: 'doctors', path: '/doctors', icon: Stethoscope },
  { translationKey: 'providers', path: '/providers', icon: BriefcaseMedical },
  { translationKey: 'emergencyTransport', path: '/ambulances', icon: Ambulance },
]

export const mobileNavItems = [
  { translationKey: 'home', path: '/' },
  { translationKey: 'myHealth', path: '/health' },
  { translationKey: 'emergency', path: '/emergency', highlight: true },
  { translationKey: 'blood', path: '/blood' },
  { translationKey: 'hospitals', path: '/hospitals' },
  { translationKey: 'doctors', path: '/doctors' },
  { translationKey: 'providers', path: '/providers' },
  { translationKey: 'profile', path: '/profile' },
]

export const userMenuItems = [
  { translationKey: 'profile', path: '/profile', icon: UserRound },
  { translationKey: 'myHealth', path: '/health', icon: Activity },
  { translationKey: 'medicalRecords', path: '/health', icon: Syringe },
  { translationKey: 'settings', path: '/profile', icon: Bath },
  { translationKey: 'privacy', path: '/profile', icon: ShieldAlert },
]

export const authActions = [
  { translationKey: 'login', path: '/login' },
  { translationKey: 'signUp', path: '/register' },
]
