// Stub for getting wardrobe context from Supabase database
// We will return a string formatted for the system prompt containing user's clothes.
export async function getWardrobeContext(token: string): Promise<string> {
  // In a real implementation, you would:
  // 1. Initialize Supabase client using the JWT token
  // 2. Query the 'wardrobe' table for the current user's items
  // 3. Format the result into a readable string for the AI.

  // For this initial implementation, we return dummy data that matches the requested schema
  // Fields: name, category, subcategory, color, image_url

  const dummyWardrobe = [
    {
      id: "w1",
      name: "Classic White Tee",
      category: "Top",
      subcategory: "T-Shirt",
      color: "White",
      image_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    },
    {
      id: "w2",
      name: "Black Leather Jacket",
      category: "Top",
      subcategory: "Jacket",
      color: "Black",
      image_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    },
    {
      id: "w3",
      name: "Blue Denim Jeans",
      category: "Bottom",
      subcategory: "Jeans",
      color: "Blue",
      image_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    },
    {
      id: "w4",
      name: "White Sneakers",
      category: "Footwear",
      subcategory: "Sneakers",
      color: "White",
      image_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    },
    {
      id: "w5",
      name: "Silver Watch",
      category: "Accessories",
      subcategory: "Watch",
      color: "Silver",
      image_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    }
  ]

  // Format as a list
  let context = "Here is the user's wardrobe:\n\n"

  dummyWardrobe.forEach(item => {
    context += `- [ID: ${item.id}] ${item.name} (${item.category} -> ${item.subcategory}), Color: ${item.color}, Image: ${item.image_url}\n`
  })

  return context
}
