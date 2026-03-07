
import { supabase } from "@/lib/supabase/client";
import { queryOptions } from "@tanstack/react-query";


export const getCampaignOption = () => queryOptions({
    queryKey: ["get-campaigns"],
    queryFn: async () => {
        const { data, error } = await supabase.from('campaigns')
            .select('*, segments(id,name), templates(id,template_name)'); // Get campaigns with related segments and templates
        if (error) throw new Error(error.message);
        return data;
    }
})