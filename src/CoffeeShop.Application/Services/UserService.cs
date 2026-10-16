using Microsoft.EntityFrameworkCore;
using CoffeeShop.Application.Interfaces;
using CoffeeShop.Application.DTOs.Common;
using CoffeeShop.Application.DTOs.Users;
using CoffeeShop.Domain.Entities;

namespace CoffeeShop.Application.Services;

public class UserService : IUserService
{
    private readonly IApplicationDbContext _context;

    public UserService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<UserResponse>> SearchUsersAsync(UserSearchQuery query)
    {
        var dbQuery = _context.Users.AsNoTracking().Include(u => u.Role).AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var kw = query.Keyword.Trim().ToLower();
            dbQuery = dbQuery.Where(u => u.Username.ToLower().Contains(kw) || u.FullName.ToLower().Contains(kw));
        }

        if (query.RoleId.HasValue)
        {
            dbQuery = dbQuery.Where(u => u.RoleId == query.RoleId.Value);
        }

        if (query.IsActive.HasValue)
        {
            dbQuery = dbQuery.Where(u => u.IsActive == query.IsActive.Value);
        }

        var totalCount = await dbQuery.CountAsync();
        var pageNumber = query.PageNumber > 0 ? query.PageNumber : 1;
        var pageSize = query.PageSize > 0 ? query.PageSize : 10;

        var items = await dbQuery
            .OrderBy(u => u.UserId)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserResponse
            {
                UserId = u.UserId,
                RoleId = u.RoleId,
                RoleName = u.Role.RoleName,
                Username = u.Username,
                FullName = u.FullName,
                IsActive = u.IsActive
            })
            .ToListAsync();

        return new PagedResult<UserResponse>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<UserResponse> GetByIdAsync(int id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserId == id);

        if (user == null)
            throw new KeyNotFoundException($"Không tìm thấy tài khoản có mã {id}");

        return new UserResponse
        {
            UserId = user.UserId,
            RoleId = user.RoleId,
            RoleName = user.Role.RoleName,
            Username = user.Username,
            FullName = user.FullName,
            IsActive = user.IsActive
        };
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request)
    {
        var exists = await _context.Users.AnyAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower());
        if (exists)
            throw new InvalidOperationException($"Tên đăng nhập '{request.Username.Trim()}' đã tồn tại.");

        var role = await _context.Roles.FindAsync(request.RoleId);
        if (role == null)
            throw new KeyNotFoundException($"Không tìm thấy vai trò có mã {request.RoleId}");

        var user = new User
        {
            RoleId = request.RoleId,
            Username = request.Username.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            IsActive = request.IsActive
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new UserResponse
        {
            UserId = user.UserId,
            RoleId = user.RoleId,
            RoleName = role.RoleName,
            Username = user.Username,
            FullName = user.FullName,
            IsActive = user.IsActive
        };
    }

    public async Task<UserResponse> UpdateAsync(int id, UpdateUserRequest request)
    {
        var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == id);
        if (user == null)
            throw new KeyNotFoundException($"Không tìm thấy tài khoản có mã {id}");

        var role = await _context.Roles.FindAsync(request.RoleId);
        if (role == null)
            throw new KeyNotFoundException($"Không tìm thấy vai trò có mã {request.RoleId}");

        user.RoleId = request.RoleId;
        user.FullName = request.FullName.Trim();
        user.IsActive = request.IsActive;

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        }

        await _context.SaveChangesAsync();

        return new UserResponse
        {
            UserId = user.UserId,
            RoleId = user.RoleId,
            RoleName = role.RoleName,
            Username = user.Username,
            FullName = user.FullName,
            IsActive = user.IsActive
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            throw new KeyNotFoundException($"Không tìm thấy tài khoản có mã {id}");

        // Toggle active state
        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();
        return true;
    }
}
