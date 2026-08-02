import { getSupabaseClient } from "./supabase";
export type ServiceType="location"|"catering"|"photography";
export type BookingMode="standalone"|"add_on"|"bundle_only"|"full_package";
export type ExternalPolicy="allowed"|"restricted"|"not_allowed";
export type PartnerServiceArea={id:string;partnerId:string;serviceType:ServiceType;isActive:boolean;bookingMode:BookingMode;externalAddonsPolicy:ExternalPolicy;externalAddonsNote:string};
const fields="id,partner_id,service_type,is_active,booking_mode,external_addons_policy,external_addons_note";
const map=(row:Record<string,unknown>):PartnerServiceArea=>({id:String(row.id),partnerId:String(row.partner_id),serviceType:row.service_type as ServiceType,isActive:Boolean(row.is_active),bookingMode:row.booking_mode as BookingMode,externalAddonsPolicy:row.external_addons_policy as ExternalPolicy,externalAddonsNote:String(row.external_addons_note??"")});
export async function fetchPartnerServiceAreas(partnerId:string){const {data,error}=await getSupabaseClient().from("partner_service_areas").select(fields).eq("partner_id",partnerId);if(error)throw error;return(data??[]).map(map);}
export async function savePartnerServiceArea(partnerId:string,input:Omit<PartnerServiceArea,"id"|"partnerId">){const {data,error}=await getSupabaseClient().from("partner_service_areas").upsert({partner_id:partnerId,service_type:input.serviceType,is_active:input.isActive,booking_mode:input.bookingMode,external_addons_policy:input.externalAddonsPolicy,external_addons_note:input.externalAddonsNote.trim()},{onConflict:"partner_id,service_type"}).select(fields).single();if(error)throw error;return map(data);}
