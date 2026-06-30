import { getProfileCount } from '@/lib/profiles';

export async function GET() {
  const count = await getProfileCount();
  return Response.json({ count });
}
