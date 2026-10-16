using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using CoffeeShop.Application.Interfaces;
using CoffeeShop.Application.DTOs.Common;
using CoffeeShop.Application.DTOs.Products;
using CoffeeShop.Domain.Entities;

namespace CoffeeShop.Application.Services;

public class ProductService : IProductService
{
    private readonly IApplicationDbContext _context;

    public ProductService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ProductResponse>> SearchProductsAsync(ProductSearchQuery query)
    {
        var items = new List<ProductResponse>();
        int totalCount = 0;

        var connection = _context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = "sp_SearchProducts";
            cmd.CommandType = CommandType.StoredProcedure;

            // @Keyword
            var pKeyword = cmd.CreateParameter();
            pKeyword.ParameterName = "@Keyword";
            pKeyword.Value = string.IsNullOrWhiteSpace(query.Keyword) ? DBNull.Value : query.Keyword.Trim();
            cmd.Parameters.Add(pKeyword);

            // @CategoryId
            var pCategoryId = cmd.CreateParameter();
            pCategoryId.ParameterName = "@CategoryId";
            pCategoryId.Value = query.CategoryId.HasValue ? query.CategoryId.Value : DBNull.Value;
            cmd.Parameters.Add(pCategoryId);

            // @Status
            var pStatus = cmd.CreateParameter();
            pStatus.ParameterName = "@Status";
            pStatus.Value = query.Status.HasValue ? query.Status.Value : DBNull.Value;
            cmd.Parameters.Add(pStatus);

            // @MinPrice
            var pMinPrice = cmd.CreateParameter();
            pMinPrice.ParameterName = "@MinPrice";
            pMinPrice.Value = query.MinPrice.HasValue ? query.MinPrice.Value : DBNull.Value;
            cmd.Parameters.Add(pMinPrice);

            // @MaxPrice
            var pMaxPrice = cmd.CreateParameter();
            pMaxPrice.ParameterName = "@MaxPrice";
            pMaxPrice.Value = query.MaxPrice.HasValue ? query.MaxPrice.Value : DBNull.Value;
            cmd.Parameters.Add(pMaxPrice);

            // @PageNumber
            var pPageNumber = cmd.CreateParameter();
            pPageNumber.ParameterName = "@PageNumber";
            pPageNumber.Value = query.PageNumber > 0 ? query.PageNumber : 1;
            cmd.Parameters.Add(pPageNumber);

            // @PageSize
            var pPageSize = cmd.CreateParameter();
            pPageSize.ParameterName = "@PageSize";
            pPageSize.Value = query.PageSize > 0 ? query.PageSize : 10;
            cmd.Parameters.Add(pPageSize);

            // @TotalCount OUTPUT
            var pTotalCount = cmd.CreateParameter();
            pTotalCount.ParameterName = "@TotalCount";
            pTotalCount.Direction = ParameterDirection.Output;
            pTotalCount.DbType = DbType.Int32;
            cmd.Parameters.Add(pTotalCount);

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    items.Add(new ProductResponse
                    {
                        ProductId = reader.GetInt32(reader.GetOrdinal("ProductId")),
                        CategoryId = reader.GetInt32(reader.GetOrdinal("CategoryId")),
                        CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                        Name = reader.GetString(reader.GetOrdinal("Name")),
                        Price = reader.GetDecimal(reader.GetOrdinal("Price")),
                        Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                    });
                }
            }

            if (pTotalCount.Value != DBNull.Value && pTotalCount.Value != null)
            {
                totalCount = Convert.ToInt32(pTotalCount.Value);
            }
        }

        return new PagedResult<ProductResponse>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }

    public async Task<ProductResponse> GetByIdAsync(int id)
    {
        var p = await _context.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.ProductId == id);

        if (p == null)
            throw new KeyNotFoundException($"Không tìm thấy sản phẩm có mã {id}");

        return new ProductResponse
        {
            ProductId = p.ProductId,
            CategoryId = p.CategoryId,
            CategoryName = p.Category.Name,
            Name = p.Name,
            Price = p.Price,
            Description = p.Description,
            IsActive = p.IsActive
        };
    }

    public async Task<ProductResponse> CreateAsync(CreateProductRequest request)
    {
        var category = await _context.Categories.FindAsync(request.CategoryId);
        if (category == null)
            throw new KeyNotFoundException($"Không tìm thấy danh mục có mã {request.CategoryId}");

        var product = new Product
        {
            CategoryId = request.CategoryId,
            Name = request.Name.Trim(),
            Price = request.Price,
            Description = request.Description?.Trim(),
            IsActive = request.IsActive
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return new ProductResponse
        {
            ProductId = product.ProductId,
            CategoryId = product.CategoryId,
            CategoryName = category.Name,
            Name = product.Name,
            Price = product.Price,
            Description = product.Description,
            IsActive = product.IsActive
        };
    }

    public async Task<ProductResponse> UpdateAsync(int id, UpdateProductRequest request)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
            throw new KeyNotFoundException($"Không tìm thấy sản phẩm có mã {id}");

        var category = await _context.Categories.FindAsync(request.CategoryId);
        if (category == null)
            throw new KeyNotFoundException($"Không tìm thấy danh mục có mã {request.CategoryId}");

        product.CategoryId = request.CategoryId;
        product.Name = request.Name.Trim();
        product.Price = request.Price;
        product.Description = request.Description?.Trim();
        product.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return new ProductResponse
        {
            ProductId = product.ProductId,
            CategoryId = product.CategoryId,
            CategoryName = category.Name,
            Name = product.Name,
            Price = product.Price,
            Description = product.Description,
            IsActive = product.IsActive
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _context.Products
            .Include(p => p.OrderDetails)
            .FirstOrDefaultAsync(p => p.ProductId == id);

        if (product == null)
            throw new KeyNotFoundException($"Không tìm thấy sản phẩm có mã {id}");

        if (product.OrderDetails.Any())
        {
            // Soft-delete if already used in orders
            product.IsActive = false;
        }
        else
        {
            _context.Products.Remove(product);
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
