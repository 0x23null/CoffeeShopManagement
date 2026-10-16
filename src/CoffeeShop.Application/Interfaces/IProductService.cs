using CoffeeShop.Application.DTOs.Common;
using CoffeeShop.Application.DTOs.Products;

namespace CoffeeShop.Application.Interfaces;

public interface IProductService
{
    Task<PagedResult<ProductResponse>> SearchProductsAsync(ProductSearchQuery query);
    Task<ProductResponse> GetByIdAsync(int id);
    Task<ProductResponse> CreateAsync(CreateProductRequest request);
    Task<ProductResponse> UpdateAsync(int id, UpdateProductRequest request);
    Task<bool> DeleteAsync(int id);
}
