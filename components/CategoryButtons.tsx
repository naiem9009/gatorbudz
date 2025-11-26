import { getCategory } from "@/lib/utils"
import { Button } from "./ui/button"

// Memoized category buttons
const CategoryButtons = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: { 
  categories: readonly string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void 
}) => (
  <div className="flex flex-wrap gap-2 mb-6">
    {categories.map((category) => (
      <Button
        key={category}
        onClick={() => onCategoryChange(category)}
        variant={selectedCategory === category ? "default" : "outline"}
        size="sm"
        className={`transition-all ${
          selectedCategory === category
            ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
            : "bg-transparent border-border hover:border-accent hover:text-accent"
        }`}
      >
        {getCategory(category)}
      </Button>
    ))}
  </div>
)


export default CategoryButtons