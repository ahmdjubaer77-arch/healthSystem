import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { divIcon } from 'leaflet'

const hospitalIcon = divIcon({
  className: 'hospital-marker',
  html: '<div class="h-8 w-8 rounded-full border-4 border-white bg-red-500 shadow-lg"></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function NearbyHospitalMap({ hospitals, userLocation }) {
  return (
    <MapContainer center={[userLocation?.latitude || 23.685, userLocation?.longitude || 90.36]} zoom={11} scrollWheelZoom className="h-full w-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {hospitals.map((hospital) => (
        <Marker key={hospital.id} position={[hospital.coordinates.latitude, hospital.coordinates.longitude]} icon={hospitalIcon}>
          <Popup><strong>{hospital.name}</strong><br />{hospital.address}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default NearbyHospitalMap
