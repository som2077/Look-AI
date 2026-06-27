export async function POST(request: Request) {
  const { identifier } = await request.json();

  return Response.json({
    success: true,
    limit: 10,
    remaining: 10,
    reset: 0,
    identifier,
  });
}
