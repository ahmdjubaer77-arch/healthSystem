export const navigationLinks = [
  { label: 'Home', href: '/' },
  { label: 'Health', href: '/health' },
  { label: 'Emergency', href: '/emergency' },
  { label: 'Blood', href: '/blood' },
  { label: 'Hospitals', href: '/hospitals' },
  { label: 'Doctors', href: '/doctors' },
]

export const searchCategories = [
  { id: 'hospitals', label: '🏥 Hospitals', icon: '🏥' },
  { id: 'blood', label: '🩸 Blood', icon: '🩸' },
  { id: 'doctors', label: '👨‍⚕️ Doctors', icon: '👨‍⚕️' },
  { id: 'ambulance', label: '🚑 Ambulance', icon: '🚑' },
]

export const locationOptions = {
  divisions: ['Barishal', 'Dhaka', 'Chattogram', 'Khulna', 'Rajshahi'],
  districts: ['Barishal District', 'Dhaka District', 'Chattogram District', 'Khulna District', 'Rajshahi District'],
  upazilas: ['Barishal Sadar', 'Kawnia', 'Gournadi', 'Dhanmondi', 'Motijheel'],
}

export const homeServices = [
  {
    id: 'health',
    icon: 'heartPulse',
    title: 'My Health',
    description: 'Manage your personal health history, medications, and care information.',
    href: '/health',
  },
  {
    id: 'hospitals',
    icon: 'hospital',
    title: 'Hospital Finder',
    description: 'Find nearby hospitals, emergency services, and locations.',
    href: '/hospitals',
  },
  {
    id: 'ambulance',
    icon: 'ambulance',
    title: 'Ambulance',
    description: 'Find transport and get information about emergency assistance.',
    href: '/emergency',
  },
  {
    id: 'blood',
    icon: 'droplets',
    title: 'Blood Donor Finder',
    description: 'Find compatible blood donors and contact them.',
    href: '/blood',
  },
  {
    id: 'doctors',
    icon: 'stethoscope',
    title: 'Doctors',
    description: 'Find information about verified healthcare professionals.',
    href: '/doctors',
  },
]

export const nearbyHospitals = [
  {
    id: 1,
    name: 'Barishal General Hospital',
    location: 'Barishal Sadar, Barishal',
    distance: '2.1 km',
    emergency: '24/7 Emergency',
    status: 'Open',
    phone: '+8801712345678',
    verified: true,
    lastUpdated: 'Demo data • Updated 15 mins ago',
  },
  {
    id: 2,
    name: 'Dr. Kamal Hospital',
    location: 'Kawnia, Barishal',
    distance: '3.7 km',
    emergency: 'Emergency Ward',
    status: 'Open',
    phone: '+8801812345678',
    verified: true,
    lastUpdated: 'Demo data • Updated 30 mins ago',
  },
  {
    id: 3,
    name: 'Madhabdi Medical Center',
    location: 'Gournadi, Barishal',
    distance: '6.4 km',
    emergency: 'Limited emergency service',
    status: 'Closed',
    phone: '+8801912345678',
    verified: false,
    lastUpdated: 'Demo data • Updated 1 hr ago',
  },
]

export const bloodDonors = [
  {
    name: 'Rafi Ahmed',
    group: 'A+',
    location: 'Barishal Sadar',
    status: 'Available',
    availability: 'green',
    lastUpdated: '5 minutes ago',
  },
  {
    name: 'Nusrat Jahan',
    group: 'O+',
    location: 'Kawnia',
    status: 'Temporarily unavailable',
    availability: 'amber',
    lastUpdated: '1 hour ago',
  },
  {
    name: 'Shahidul Islam',
    group: 'B+',
    location: 'Gournadi',
    status: 'Not available',
    availability: 'red',
    lastUpdated: 'Today',
  },
]

export const emergencyActions = [
  { icon: 'hospital', label: 'Find an emergency hospital' },
  { icon: 'ambulance', label: 'Find an ambulance' },
  { icon: 'drop', label: 'Find a blood donor' },
  { icon: 'phone', label: 'Call 999' },
]

export const trustItems = [
  { label: 'Verified Doctor', note: 'Demo provider verification labels for interface design.' },
  { label: 'Verified Hospital', note: 'Facility references shown for prototype UI testing.' },
  { label: 'Verified Pharmacy', note: 'Stock checks and listing status shown in demo mode.' },
  { label: 'Verified Blood Request', note: 'Sample blood request status blocks for future workflow integration.' },
]
