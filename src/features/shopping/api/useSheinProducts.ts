import { request } from "@/shared/api/http";
import { showToast } from "@/shared/ui/toast-store";
import { useEffect, useState } from "react";

export interface SheinProduct {
  id: string;
  title: string;
  brand: string;
  price: string;
  image: string;
  url: string;
}

export function useSheinProducts() {
  const [products, setProducts] = useState<SheinProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
        const apiHost =
          process.env.EXPO_PUBLIC_SHEIN_RAPIDAPI_HOST ||
          "shein-data-api.p.rapidapi.com";

        if (!apiKey) throw new Error("Missing API Key");

        const url =
          "https://shein-data-api.p.rapidapi.com/product/recommended?goodsId=10559554&limit=10&countryCode=US";

        // Fail fast (no retries): the dummy fallback is the product here, and a
        // 403/429 shouldn't stall the shopping tab while we back off.
        const data = await request<{ data?: Array<Record<string, unknown>> }>({
          url,
          method: "GET",
          headers: {
            "x-rapidapi-host": apiHost,
            "x-rapidapi-key": apiKey,
          },
          retries: 0,
        });

        if (data && data.data && Array.isArray(data.data)) {
          const formatted: SheinProduct[] = data.data
            .slice(0, 10)
            .map((p: any) => {
              let img = p.goods_img || p.main_image || "";
              if (img && !img.startsWith("http")) img = "https:" + img;
              const priceVal =
                p.retailPrice?.amount || p.sale_price?.amount || p.price || "0";
              return {
                id: String(p.goods_id || p.id || Math.random()),
                title: p.goods_name || p.name || "Shein Product",
                brand: "SHEIN",
                price: `$${parseFloat(priceVal).toFixed(2)}`,
                image: img,
                url: `https://www.shein.com/product-p-${p.goods_id || ""}.html`,
              };
            })
            .filter((p: SheinProduct) => p.image);
          setProducts(formatted.length > 0 ? formatted : getDummyData());
        } else {
          setProducts(getDummyData());
        }
      } catch {
        // Network error, 403 (not subscribed) or 429 (rate limited) — fall back
        // to sample products, but surface a non-blocking toast so the failure
        // isn't completely silent.
        console.warn("Shein API unreachable — using fallback products.");
        setProducts(getDummyData());
        showToast("info", "Showing sample products — live feed is unavailable");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading, error };
}

function getDummyData(): SheinProduct[] {
  return [
    {
      id: "s1",
      title: "Floral Wrap Midi Dress",
      brand: "SHEIN",
      price: "$18.99",
      image:
        "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400&q=80",
      url: "https://www.shein.com",
    },
    {
      id: "s2",
      title: "Oversized Graphic Hoodie",
      brand: "SHEIN",
      price: "$22.49",
      image:
        "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80",
      url: "https://www.shein.com",
    },
    {
      id: "s3",
      title: "High Waist Skinny Jeans",
      brand: "SHEIN",
      price: "$25.99",
      image:
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80",
      url: "https://www.shein.com",
    },
    {
      id: "s4",
      title: "Ribbed Crop Cardigan",
      brand: "SHEIN",
      price: "$15.99",
      image:
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80",
      url: "https://www.shein.com",
    },
    {
      id: "s5",
      title: "Satin Slip Skirt",
      brand: "SHEIN",
      price: "$13.49",
      image:
        "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80",
      url: "https://www.shein.com",
    },
    {
      id: "s6",
      title: "Lace Trim Cami Top",
      brand: "SHEIN",
      price: "$10.99",
      image:
        "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&q=80",
      url: "https://www.shein.com",
    },
  ];
}
