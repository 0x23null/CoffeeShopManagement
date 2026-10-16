using CoffeeShop.Application.DTOs.Auth;

namespace CoffeeShop.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
}
