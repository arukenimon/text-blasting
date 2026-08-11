import { supabase } from "@/lib/supabase/client";
import { queryOptions } from "@tanstack/react-query";


export const getTemplatesOption = (workspaceId?: string | null) => queryOptions(
    {
        queryKey: ["templates", workspaceId],
        enabled: Boolean(workspaceId),
        queryFn: async () => {
            const { data, error } = await supabase.from('templates')
                .select('*')
                .eq('workspace_id', workspaceId);
            if (error) {
                throw new Error(error.message);
            }
            return data;
        }
    }
)
