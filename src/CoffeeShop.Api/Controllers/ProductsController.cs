using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoffeeShop.Application.DTOs.Common;
using CoffeeShop.Application.DTOs.Products;
using CoffeeShop.Application.Interfaces;

namespace CoffeeShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet("search")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductResponse>>>> Search([FromQuery] ProductSearchQuery query)
    {
        var result = await _productService.SearchProductsAsync(query);
        return Ok(ApiResponse<PagedResult<ProductResponse>>.Ok(result));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<ProductResponse>>> GetById(int id)
    {
        var result = await _productService.GetByIdAsync(id);
        return Ok(ApiResponse<ProductResponse>.Ok(result));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<ProductResponse>>> Create([FromBody] CreateProductRequest request)
    {
        var result = await _productService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.ProductId }, ApiResponse<ProductResponse>.Ok(result, "Tạo sản phẩm thành công"));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<ProductResponse>>> Update(int id, [FromBody] UpdateProductRequest request)
    {
        var result = await _productService.UpdateAsync(id, request);
        return Ok(ApiResponse<ProductResponse>.Ok(result, "Cập nhật sản phẩm thành công"));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var result = await _productService.DeleteAsync(id);
        return Ok(ApiResponse<bool>.Ok(result, "Xóa hoặc vô hiệu hóa sản phẩm thành công"));
    }
}
