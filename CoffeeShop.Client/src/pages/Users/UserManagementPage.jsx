import React, { useState, useEffect } from 'react';
import { userApi } from '../../api/userApi';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../components/ui/table';
import {
  Plus,
  RotateCw,
  Search,
  Edit2,
  Lock,
  Unlock,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [keyword, setKeyword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [formData, setFormData] = useState({
    roleId: 2,
    username: '',
    password: '',
    fullName: '',
    isActive: true,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        keyword: keyword.trim() || undefined,
        roleId: roleId ? parseInt(roleId) : undefined,
        pageNumber,
        pageSize,
      };

      const res = await userApi.search(params);
      if (res && res.data) {
        setUsers(res.data.items || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pageNumber, pageSize]);

  const handleSearch = (e) => {
    e?.preventDefault();
    setPageNumber(1);
    fetchUsers();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedUserId(null);
    setFormData({
      roleId: 2,
      username: '',
      password: '',
      fullName: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setIsEditing(true);
    setSelectedUserId(u.userId);
    setFormData({
      roleId: u.roleId,
      username: u.username,
      password: '',
      fullName: u.fullName,
      isActive: u.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!formData.fullName.trim()) return;

    try {
      if (isEditing) {
        await userApi.update(selectedUserId, {
          roleId: parseInt(formData.roleId),
          fullName: formData.fullName.trim(),
          newPassword: formData.password || undefined,
          isActive: formData.isActive,
        });
      } else {
        await userApi.create({
          roleId: parseInt(formData.roleId),
          username: formData.username.trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          isActive: formData.isActive,
        });
      }

      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Lỗi lưu tài khoản');
    }
  };

  const handleToggleStatus = async (u) => {
    const act = u.isActive ? 'Khóa' : 'Kích hoạt lại';
    if (!window.confirm(`${act} tài khoản "${u.username}"?`)) return;
    try {
      await userApi.delete(u.userId);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Lỗi đổi trạng thái');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Quản lý tài khoản</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus className="size-4 mr-1.5" />
            Thêm tài khoản
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RotateCw className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Card */}
      <form onSubmit={handleSearch} className="p-4 bg-card rounded-xl border border-border/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <Label>Tìm kiếm</Label>
            <Input
              type="text"
              placeholder="Tên đăng nhập hoặc họ tên..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Vai trò</Label>
            <select
              className="h-8.5 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 shadow-2xs"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="1">Admin (Quản trị)</option>
              <option value="2">Staff (Nhân viên)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" size="default" className="w-full sm:w-auto px-5">
              <Search className="size-3.5 mr-1.5" />
              Tìm
            </Button>
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-15">ID</TableHead>
              <TableHead>Tên đăng nhập</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-center w-32.5">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="size-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                  Đang tải danh sách tài khoản...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Không tìm thấy tài khoản nào.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.userId}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{u.userId}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground font-mono">
                    {u.username}
                  </TableCell>
                  <TableCell>{u.fullName}</TableCell>
                  <TableCell>
                    <Badge variant={u.roleName === 'Admin' ? 'default' : 'secondary'}>
                      {u.roleName === 'Admin' ? 'Admin' : 'Staff'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? 'success' : 'destructive'}>
                      {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEdit(u)}
                        title="Sửa"
                      >
                        <Edit2 className="size-3 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        variant={u.isActive ? 'destructiveOutline' : 'outline'}
                        size="xs"
                        onClick={() => handleToggleStatus(u)}
                        title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {u.isActive ? (
                          <>
                            <Lock className="size-3 mr-1" />
                            Khóa
                          </>
                        ) : (
                          <>
                            <Unlock className="size-3 mr-1" />
                            Mở
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          currentPage={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPageNumber}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPageNumber(1);
          }}
          pageSizeOptions={[10, 50, 100]}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Sửa thông tin tài khoản' : 'Thêm tài khoản mới'}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button size="sm" onClick={handleSave}>
              Lưu
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <select
              className="h-8.5 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 shadow-2xs"
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
            >
              <option value="2">Staff (Nhân viên)</option>
              <option value="1">Admin (Quản trị viên)</option>
            </select>
          </div>

          {!isEditing && (
            <div className="space-y-1.5">
              <Label>Tên đăng nhập</Label>
              <Input
                type="text"
                placeholder="VD: staff01"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>
              {isEditing ? 'Mật khẩu mới' : 'Mật khẩu'}
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!isEditing}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Họ và tên</Label>
            <Input
              type="text"
              placeholder="VD: Nguyễn Văn A"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="userActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="size-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
            />
            <label htmlFor="userActive" className="text-xs font-medium text-foreground cursor-pointer select-none">
              Kích hoạt tài khoản
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
