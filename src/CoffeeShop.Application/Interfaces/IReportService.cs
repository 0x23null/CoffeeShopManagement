using CoffeeShop.Application.DTOs.Reports;

namespace CoffeeShop.Application.Interfaces;

public interface IReportService
{
    Task<SummaryReportResponse> GetSummaryReportAsync();
    Task<List<TopProductReportResponse>> GetTopProductsAsync(int top = 5);
}
