export async function GET() {
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST || "asos2.p.rapidapi.com";

  if (!apiKey) {
    return Response.json({ products: [] });
  }

  const url =
    "https://asos2.p.rapidapi.com/products/v2/list?store=US&offset=0&categoryId=4209&limit=10&country=US&sort=freshness&currency=USD&sizeSchema=US&lang=en-US";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": apiHost,
    },
  });

  if (!response.ok) {
    return Response.json({ products: [] }, { status: response.status });
  }

  const data = await response.json();
  return Response.json({ products: data.products ?? [] });
}
