using CoffeeShop.Application.DTOs.Common;
using CoffeeShop.Application.DTOs.Users;

namespace CoffeeShop.Application.Interfaces;

public interface IUserService
{
    Task<PagedResult<UserResponse>> SearchUsersAsync(UserSearchQuery query);
    Task<UserResponse> GetByIdAsync(int id);
    Task<UserResponse> CreateAsync(CreateUserRequest request);
    Task<UserResponse> UpdateAsync(int id, UpdateUserRequest request);
    Task<bool> DeleteAsync(int id);
}
