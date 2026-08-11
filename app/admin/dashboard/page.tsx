"use client";

import { useQuery } from "@tanstack/react-query";
import { CampaignsTable } from "../../components/dashboard/campaigns-table";
import { statItems } from "../../components/dashboard/dashboard-data";
import { DashboardLayout } from "../../components/dashboard/dashboard-layout";
import { RightPanel } from "../../components/dashboard/right-panel";
import { StatCards } from "../../components/dashboard/stat-cards";
import { Topbar } from "../../components/dashboard/topbar";
import { getCampaignOption } from "../campaigns/QueryOptions";
import { getSegmentsOption } from "../audience/QueryOptions";
import { useMessagesRealtime } from "@/lib/realtime/messages";
import { useAuth } from "@/app/components/auth-provider";

export default function DashboardPage() {
    const { activeWorkspace } = useAuth();
    const workspaceId = activeWorkspace?.id;
    useMessagesRealtime({ workspaceId });
    const { data: campaigns } = useQuery(getCampaignOption(workspaceId));
    const { data: segments } = useQuery(getSegmentsOption(workspaceId));

    return (
        <DashboardLayout>
            <Topbar />
            <div className="mt-6 space-y-6">
                <StatCards items={statItems} />
                <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                    <CampaignsTable items={(campaigns ?? []).slice(0, 8) as never} />
                    <RightPanel segments={(segments ?? []) as never} activities={[]} />
                </section>
            </div>
        </DashboardLayout>
    );
}
