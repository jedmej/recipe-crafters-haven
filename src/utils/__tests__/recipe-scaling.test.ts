import { describe, it, expect } from 'vitest';
import { parseIngredient, scaleRecipe } from '../recipe-scaling';

describe('parseIngredient', () => {
  it('parses simple ingredient with quantity and unit', () => {
    const result = parseIngredient('2 cups flour');
    expect(result).toEqual({
      quantity: 2,
      unit: 'cups',
      ingredient: 'flour',
      originalText: '2 cups flour'
    });
  });

  it('parses fraction quantities', () => {
    const result = parseIngredient('1/2 cup sugar');
    expect(result).toEqual({
      quantity: 0.5,
      unit: 'cup',
      ingredient: 'sugar',
      originalText: '1/2 cup sugar'
    });
  });

  it('handles ingredient without unit', () => {
    const result = parseIngredient('2 eggs');
    expect(result).toEqual({
      quantity: 2,
      unit: '',
      ingredient: 'eggs',
      originalText: '2 eggs'
    });
  });
});

describe('scaleRecipe', () => {
  const baseRecipe = {
    title: 'Test Recipe',
    description: 'Test Description',
    ingredients: [
      '2 cups flour',
      '1 cup sugar',
      '3 eggs'
    ],
    instructions: ['Step 1', 'Step 2'],
    prep_time: 20,
    cook_time: 30,
    estimated_calories: 500,
    suggested_portions: 4,
    portion_description: '4 servings'
  };

  it('scales ingredients correctly', () => {
    const scaled = scaleRecipe(baseRecipe, 8, 4);
    expect(scaled.ingredients).toEqual([
      '4.00 cups flour',
      '2.00 cup sugar',
      '3 eggs' // Non-unit ingredients remain unchanged
    ]);
  });

  it('scales time and calories proportionally', () => {
    const scaled = scaleRecipe(baseRecipe, 8, 4);
    expect(scaled.prep_time).toBe(28); // sqrt(2) * 20
    expect(scaled.cook_time).toBe(42); // sqrt(2) * 30
    expect(scaled.estimated_calories).toBe(1000); // 2 * 500
  });

  it('returns original recipe for invalid portions', () => {
    const scaled = scaleRecipe(baseRecipe, 0, 4);
    expect(scaled).toEqual(baseRecipe);
  });
}); 