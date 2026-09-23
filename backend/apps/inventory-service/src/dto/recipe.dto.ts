export class RecipeItemDto {
  inventoryItemId: string;
  quantity: number;
}

export class CreateRecipeDto {
  menuItemId: string;
  items: RecipeItemDto[];
}
