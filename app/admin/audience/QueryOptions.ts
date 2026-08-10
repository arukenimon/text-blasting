
import { supabase } from "@/lib/supabase/client";
import { queryOptions } from "@tanstack/react-query";


export const getSegmentsOption = () => queryOptions({
    queryKey: ["get-segments"],
    queryFn: async () => {
        const { data, error } = await supabase.from('segments')
            .select('*, contacts(count)'); // Get segments with count of related contacts
        if (error) throw new Error(error.message);
        return data ?? [];
    }
})

export const getContactsOption = () => queryOptions({
    queryKey: ["get-contacts"],
    queryFn: async () => {
        const { data, error } = await supabase
            .from('contacts')
            .select('*, segments(id, name, color_hex)')
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data ?? [];
    },
})
