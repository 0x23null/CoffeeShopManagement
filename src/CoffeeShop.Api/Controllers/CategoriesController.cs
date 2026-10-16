using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoffeeShop.Application.DTOs.Categories;
using CoffeeShop.Application.DTOs.Common;
using CoffeeShop.Application.Interfaces;

namespace CoffeeShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<List<CategoryResponse>>>> GetAll([FromQuery] bool? activeOnly = null)
    {
        var result = await _categoryService.GetAllAsync(activeOnly);
        return Ok(ApiResponse<List<CategoryResponse>>.Ok(result));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<CategoryResponse>>> GetById(int id)
    {
        var result = await _categoryService.GetByIdAsync(id);
        return Ok(ApiResponse<CategoryResponse>.Ok(result));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<CategoryResponse>>> Create([FromBody] CategoryRequest request)
    {
        var result = await _categoryService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.CategoryId }, ApiResponse<CategoryResponse>.Ok(result, "Tạo danh mục thành công"));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<CategoryResponse>>> Update(int id, [FromBody] CategoryRequest request)
    {
        var result = await _categoryService.UpdateAsync(id, request);
        return Ok(ApiResponse<CategoryResponse>.Ok(result, "Cập nhật danh mục thành công"));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var result = await _categoryService.DeleteAsync(id);
        return Ok(ApiResponse<bool>.Ok(result, "Xóa hoặc vô hiệu hóa danh mục thành công"));
    }
}
