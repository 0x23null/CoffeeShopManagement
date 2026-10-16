using CoffeeShop.Application.DTOs.Categories;

namespace CoffeeShop.Application.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryResponse>> GetAllAsync(bool? activeOnly = null);
    Task<CategoryResponse> GetByIdAsync(int id);
    Task<CategoryResponse> CreateAsync(CategoryRequest request);
    Task<CategoryResponse> UpdateAsync(int id, CategoryRequest request);
    Task<bool> DeleteAsync(int id);
}
