import { Category } from "@/lib/types";

/**
 * High-quality Unsplash placeholder images by category.
 * Used when facility has no image from the API.
 */
const CATEGORY_PLACEHOLDERS: Record<Category, string[]> = {
  fitness: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop&q=80",
  ],
  swimming: [
    "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&h=600&fit=crop&q=80",
  ],
  wellness: [
    "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop&q=80",
  ],
  yoga: [
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&h=600&fit=crop&q=80",
  ],
  water: [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526290300288-74e93680c09e?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800&h=600&fit=crop&q=80",
  ],
  group: [
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800&h=600&fit=crop&q=80",
  ],
  sports: [
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551773188-d4f40569fac4?w=800&h=600&fit=crop&q=80",
  ],
  climbing: [
    "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=600&fit=crop&q=80",
  ],
  kids: [
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&h=600&fit=crop&q=80",
  ],
  outdoor: [
    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1502904550040-7534597429ae?w=800&h=600&fit=crop&q=80",
  ],
  other: [
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1486218119243-13883505764c?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop&q=80",
  ],
};

/**
 * Get a deterministic placeholder image based on facility id and category
 */
export function getPlaceholderImage(id: string | number, category: Category): string {
  const images = CATEGORY_PLACEHOLDERS[category] || CATEGORY_PLACEHOLDERS.other;
  // Use id to deterministically pick an image (so same facility always gets same image)
  const hash = typeof id === "string" ? id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : id;
  return images[hash % images.length];
}
