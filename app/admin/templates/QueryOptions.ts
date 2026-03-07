import { supabase } from "@/lib/supabase/client";
import { queryOptions } from "@tanstack/react-query";


export const getTemplatesOption = () => queryOptions(
    {
        queryKey: ["templates"],
        queryFn: async () => {
            const { data, error } = await supabase.from('templates')
                .select('*');
            if (error) {
                throw new Error(error.message);
            }
            return data;
        }
    }
)