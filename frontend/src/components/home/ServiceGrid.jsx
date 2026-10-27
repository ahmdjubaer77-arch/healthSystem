import ServiceCard from './ServiceCard'
import SectionHeader from '../common/SectionHeader'
import { homeServices } from '../../data/mockData'

function ServiceGrid() {
  return (
    <section className="pt-4">
      <SectionHeader
        kicker="Health services"
        title="Healthcare services in one place"
        subtitle="Healthcare Services in One Place"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {homeServices.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  )
}

export default ServiceGrid
