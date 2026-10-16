using Microsoft.EntityFrameworkCore;
using CoffeeShop.Application.Interfaces;
using CoffeeShop.Application.DTOs.Reports;

namespace CoffeeShop.Application.Services;

public class ReportService : IReportService
{
    private readonly IApplicationDbContext _context;

    public ReportService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SummaryReportResponse> GetSummaryReportAsync()
    {
        var now = DateTime.Now;
        var todayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0);

        var paidOrders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.Status == "Paid")
            .ToListAsync();

        var totalRevenue = paidOrders.Sum(o => o.TotalAmount);
        var totalOrders = paidOrders.Count;
        var averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        var todayOrdersList = paidOrders.Where(o => o.CreatedAt >= todayStart).ToList();
        var todayRevenue = todayOrdersList.Sum(o => o.TotalAmount);
        var todayOrders = todayOrdersList.Count;

        var totalProducts = await _context.Products.CountAsync(p => p.IsActive);
        var activeTables = await _context.CafeTables.CountAsync(t => t.IsActive);
        var occupiedTables = await _context.CafeTables.CountAsync(t => t.Status == "Occupied");

        // Last 7 days revenue
        var sevenDaysAgo = todayStart.AddDays(-6);
        var recentPaid = paidOrders.Where(o => o.CreatedAt >= sevenDaysAgo).ToList();

        var revenueByDate = new List<DailyRevenuePoint>();
        for (int i = 6; i >= 0; i--)
        {
            var day = todayStart.AddDays(-i);
            var nextDay = day.AddDays(1);
            var dayOrders = recentPaid.Where(o => o.CreatedAt >= day && o.CreatedAt < nextDay).ToList();

            revenueByDate.Add(new DailyRevenuePoint
            {
                Date = day.ToString("dd/MM"),
                Revenue = dayOrders.Sum(o => o.TotalAmount),
                OrdersCount = dayOrders.Count
            });
        }

        return new SummaryReportResponse
        {
            TotalRevenue = totalRevenue,
            TodayRevenue = todayRevenue,
            TotalOrders = totalOrders,
            TodayOrders = todayOrders,
            AverageOrderValue = Math.Round(averageOrderValue, 2),
            TotalProducts = totalProducts,
            ActiveTables = activeTables,
            OccupiedTables = occupiedTables,
            RevenueByDate = revenueByDate
        };
    }

    public async Task<List<TopProductReportResponse>> GetTopProductsAsync(int top = 5)
    {
        var topProducts = await _context.OrderDetails
            .AsNoTracking()
            .Where(d => d.Order.Status == "Paid")
            .GroupBy(d => new { d.ProductId, d.Product.Name, CategoryName = d.Product.Category.Name })
            .Select(g => new TopProductReportResponse
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.Name,
                CategoryName = g.Key.CategoryName,
                TotalQuantitySold = g.Sum(x => x.Quantity),
                TotalRevenue = g.Sum(x => x.LineTotal)
            })
            .OrderByDescending(x => x.TotalQuantitySold)
            .Take(top)
            .ToListAsync();

        return topProducts;
    }
}
