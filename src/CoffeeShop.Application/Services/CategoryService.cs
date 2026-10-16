using Microsoft.EntityFrameworkCore;
using CoffeeShop.Application.Interfaces;
using CoffeeShop.Application.DTOs.Categories;
using CoffeeShop.Domain.Entities;

namespace CoffeeShop.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly IApplicationDbContext _context;

    public CategoryService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryResponse>> GetAllAsync(bool? activeOnly = null)
    {
        var query = _context.Categories.AsNoTracking();
        if (activeOnly.HasValue)
        {
            query = query.Where(c => c.IsActive == activeOnly.Value);
        }

        return await query
            .Select(c => new CategoryResponse
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                IsActive = c.IsActive,
                ProductCount = c.Products.Count
            })
            .ToListAsync();
    }

    public async Task<CategoryResponse> GetByIdAsync(int id)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.CategoryId == id);

        if (category == null)
            throw new KeyNotFoundException($"Không tìm thấy danh mục có mã {id}");

        return new CategoryResponse
        {
            CategoryId = category.CategoryId,
            Name = category.Name,
            IsActive = category.IsActive,
            ProductCount = category.Products.Count
        };
    }

    public async Task<CategoryResponse> CreateAsync(CategoryRequest request)
    {
        var exists = await _context.Categories.AnyAsync(c => c.Name.ToLower() == request.Name.Trim().ToLower());
        if (exists)
            throw new InvalidOperationException($"Danh mục '{request.Name}' đã tồn tại.");

        var category = new Category
        {
            Name = request.Name.Trim(),
            IsActive = request.IsActive
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return new CategoryResponse
        {
            CategoryId = category.CategoryId,
            Name = category.Name,
            IsActive = category.IsActive,
            ProductCount = 0
        };
    }

    public async Task<CategoryResponse> UpdateAsync(int id, CategoryRequest request)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            throw new KeyNotFoundException($"Không tìm thấy danh mục có mã {id}");

        var exists = await _context.Categories.AnyAsync(c => c.CategoryId != id && c.Name.ToLower() == request.Name.Trim().ToLower());
        if (exists)
            throw new InvalidOperationException($"Tên danh mục '{request.Name}' đã được sử dụng bởi danh mục khác.");

        category.Name = request.Name.Trim();
        category.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        var count = await _context.Products.CountAsync(p => p.CategoryId == id);

        return new CategoryResponse
        {
            CategoryId = category.CategoryId,
            Name = category.Name,
            IsActive = category.IsActive,
            ProductCount = count
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _context.Categories.Include(c => c.Products).FirstOrDefaultAsync(c => c.CategoryId == id);
        if (category == null)
            throw new KeyNotFoundException($"Không tìm thấy danh mục có mã {id}");

        if (category.Products.Any())
        {
            // Toggle active state if category has products
            category.IsActive = false;
        }
        else
        {
            _context.Categories.Remove(category);
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
