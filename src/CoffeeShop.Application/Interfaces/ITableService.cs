using CoffeeShop.Application.DTOs.Tables;

namespace CoffeeShop.Application.Interfaces;

public interface ITableService
{
    Task<List<TableResponse>> GetAllAsync(bool? activeOnly = null);
    Task<TableResponse> GetByIdAsync(int id);
    Task<TableResponse> CreateAsync(CreateTableRequest request);
    Task<TableResponse> UpdateAsync(int id, UpdateTableRequest request);
    Task<bool> DeleteAsync(int id);
}
