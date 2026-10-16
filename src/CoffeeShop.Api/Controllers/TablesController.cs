using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoffeeShop.Application.DTOs.Common;
using CoffeeShop.Application.DTOs.Tables;
using CoffeeShop.Application.Interfaces;

namespace CoffeeShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TablesController : ControllerBase
{
    private readonly ITableService _tableService;

    public TablesController(ITableService tableService)
    {
        _tableService = tableService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<List<TableResponse>>>> GetAll([FromQuery] bool? activeOnly = null)
    {
        var result = await _tableService.GetAllAsync(activeOnly);
        return Ok(ApiResponse<List<TableResponse>>.Ok(result));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ApiResponse<TableResponse>>> GetById(int id)
    {
        var result = await _tableService.GetByIdAsync(id);
        return Ok(ApiResponse<TableResponse>.Ok(result));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<TableResponse>>> Create([FromBody] CreateTableRequest request)
    {
        var result = await _tableService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.TableId }, ApiResponse<TableResponse>.Ok(result, "Tạo bàn thành công"));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<TableResponse>>> Update(int id, [FromBody] UpdateTableRequest request)
    {
        var result = await _tableService.UpdateAsync(id, request);
        return Ok(ApiResponse<TableResponse>.Ok(result, "Cập nhật bàn thành công"));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var result = await _tableService.DeleteAsync(id);
        return Ok(ApiResponse<bool>.Ok(result, "Xóa hoặc vô hiệu hóa bàn thành công"));
    }
}
