import PartnersSection from './sections/partners_section'
import LeadsSection from './sections/leads_section'
import IntegrationsSection from './sections/integrations_section'
import CampaignsSection from './sections/campaigns_section'
import AdsMetricsSection from './sections/ads_metrics_section'

export default async function AdminPartnershipsPage() {
  return (
    <div className="space-y-6 p-6">
      <PartnersSection />
      <LeadsSection />
      <IntegrationsSection />
      <CampaignsSection />
      <AdsMetricsSection />
    </div>
  )
}
