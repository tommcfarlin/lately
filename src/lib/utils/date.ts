import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const OWNER_TZ = process.env.LATELY_TIMEZONE ?? 'UTC';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function formatPostDate(utcIso: string): string {
  const date = parseISO(utcIso);
  const zonedDate = toZonedTime(date, OWNER_TZ);
  const now = new Date();

  if (now.getTime() - date.getTime() < ONE_WEEK_MS) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return format(zonedDate, 'MMMM d, yyyy');
}
