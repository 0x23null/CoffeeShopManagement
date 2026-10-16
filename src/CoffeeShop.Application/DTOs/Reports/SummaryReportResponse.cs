namespace CoffeeShop.Application.DTOs.Reports;

public class SummaryReportResponse
{
    public decimal TotalRevenue { get; set; }
    public decimal TodayRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int TodayOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int TotalProducts { get; set; }
    public int ActiveTables { get; set; }
    public int OccupiedTables { get; set; }
    public List<DailyRevenuePoint> RevenueByDate { get; set; } = new();
}

public class DailyRevenuePoint
{
    public string Date { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int OrdersCount { get; set; }
}
