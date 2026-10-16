using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoffeeShop.Application.DTOs.Common;
using CoffeeShop.Application.DTOs.Reports;
using CoffeeShop.Application.Interfaces;

namespace CoffeeShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<SummaryReportResponse>>> GetSummary()
    {
        var result = await _reportService.GetSummaryReportAsync();
        return Ok(ApiResponse<SummaryReportResponse>.Ok(result));
    }

    [HttpGet("top-products")]
    public async Task<ActionResult<ApiResponse<List<TopProductReportResponse>>>> GetTopProducts([FromQuery] int top = 5)
    {
        var result = await _reportService.GetTopProductsAsync(top);
        return Ok(ApiResponse<List<TopProductReportResponse>>.Ok(result));
    }
}
