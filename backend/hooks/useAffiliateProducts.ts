import { useEffect, useState } from "react";

export interface AffiliateProduct {
  id: string;
  title: string;
  brand: string;
  price: string;
  image: string;
  url: string;
}

export function useAffiliateProducts() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
        const apiHost =
          process.env.EXPO_PUBLIC_RAPIDAPI_HOST || "asos2.p.rapidapi.com";

        if (!apiKey) {
          setProducts(getDummyData());
          setLoading(false);
          return;
        }

        // Using ASOS API v2 list endpoint
        // categoryId 4209 is Men's clothing (just as a default)
        const url =
          "https://asos2.p.rapidapi.com/products/v2/list?store=US&offset=0&categoryId=4209&limit=10&country=US&sort=freshness&currency=USD&sizeSchema=US&lang=en-US";
        const options = {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": apiHost,
          },
        };

        const response = await fetch(url, options);
        const data = await response.json();

        if (data && data.products) {
          const formatted = data.products.map((p: any) => {
            // Fix imageUrl format if it doesn't have protocol
            let img = p.imageUrl;
            if (img && !img.startsWith("http")) {
              img = "https://" + img;
            }
            return {
              id: p.id.toString(),
              title: p.name,
              brand: p.brandName || "ASOS",
              price: p.price?.current?.text || "$0.00",
              image: img || getDummyData()[0].image,
              url: `https://www.asos.com/${p.url}`,
            };
          });
          setProducts(formatted);
        } else {
          // If the API limit is reached or invalid structure, use dummy
          console.warn(
            "Invalid ASOS API response or Rate Limit exceeded. Using fallback.",
          );
          setProducts(getDummyData());
        }
      } catch (err: any) {
        console.error("API fetch error:", err);
        setError(err.message);
        setProducts(getDummyData());
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading, error };
}

function getDummyData(): AffiliateProduct[] {
  return [
    {
      id: "m1",
      title: "White Graphic Tee",
      brand: "Urban Basics",
      price: "$19.99",
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
      url: "https://asos.com",
    },
    {
      id: "m2",
      title: "White Sneakers",
      brand: "SneakerX",
      price: "$49.99",
      image:
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
      url: "https://asos.com",
    },
    {
      id: "m3",
      title: "Beige Chinos",
      brand: "Zara",
      price: "$39.99",
      image:
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80",
      url: "https://asos.com",
    },
  ];
}
