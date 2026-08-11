
import { supabase } from "@/lib/supabase/client";
import { queryOptions } from "@tanstack/react-query";


export const getSegmentsOption = (workspaceId?: string | null) => queryOptions({
    queryKey: ["get-segments", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
        const { data, error } = await supabase.from('segments')
            .select('*, contacts(count)')
            .eq('workspace_id', workspaceId); // Get segments with count of related contacts
        if (error) throw new Error(error.message);
        return data ?? [];
    }
})

export const getContactsOption = (workspaceId?: string | null) => queryOptions({
    queryKey: ["get-contacts", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
        const { data, error } = await supabase
            .from('contacts')
            .select('*, segments(id, name, color_hex)')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data ?? [];
    },
})
