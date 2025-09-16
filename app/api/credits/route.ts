import { getCredits } from '@/app/actions/credits/get'

export const GET = async () => {
  const result = await getCredits()
  return new Response(JSON.stringify(result), {
    headers: { 'content-type': 'application/json' },
  })
}


