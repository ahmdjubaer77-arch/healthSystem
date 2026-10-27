import DoctorCard from './DoctorCard'

function DoctorGrid({ doctors }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {doctors.map((doctor) => (
        <DoctorCard key={doctor.id} doctor={doctor} />
      ))}
    </div>
  )
}

export default DoctorGrid
