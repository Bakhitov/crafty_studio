export const runtime = 'edge'

export async function GET() {
  // 1x1 transparent PNG to silence 404s (ico not mandatory)
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
  const body = Buffer.from(pngBase64, 'base64')
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}

