import ProviderDirectory from '../components/providers/ProviderDirectory'
import SectionHeader from '../components/common/SectionHeader'

function Providers() {
  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        kicker="Provider directory"
        title="Healthcare provider directory"
        subtitle="A future-ready hub for doctors, hospitals, pharmacies, ambulance support, and blood service discovery."
      />

      <ProviderDirectory />
    </div>
  )
}

export default Providers
