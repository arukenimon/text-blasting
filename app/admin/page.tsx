import { CampaignsTable } from "../components/dashboard/campaigns-table";
import {
  activityItems,
  campaignItems,
  segmentItems,
  statItems,
} from "../components/dashboard/dashboard-data";
import { DashboardLayout } from "../components/dashboard/dashboard-layout";
import { RightPanel } from "../components/dashboard/right-panel";
import { StatCards } from "../components/dashboard/stat-cards";
import { Topbar } from "../components/dashboard/topbar";

export default function Home() {
  return (
    <DashboardLayout>
      <Topbar />
      <div className="mt-6 space-y-6">
        <StatCards items={statItems} />
        <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <CampaignsTable items={campaignItems} />
          <RightPanel segments={segmentItems} activities={activityItems} />
        </section>
      </div>
    </DashboardLayout>
  );
}
