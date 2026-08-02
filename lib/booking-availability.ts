import { getSupabaseClient } from "./supabase";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPackageId(value: string) {
  return uuidPattern.test(value);
}

/**
 * Direct bookings are currently day-based in the customer flow. The fixed noon
 * start avoids accidentally occupying the previous or next day when a browser
 * has another timezone. Providers' package duration and buffers are applied
 * exclusively by the database function.
 */
export function bookingStartForDate(date: string) {
  return `${date}T12:00:00.000Z`;
}

export async function checkPartnerAvailability(packageId: string, date: string) {
  const { data, error } = await getSupabaseClient().rpc("check_partner_availability", {
    requested_package_id: packageId,
    requested_starts_at: bookingStartForDate(date),
  });

  if (error) throw error;
  return data === true;
}
