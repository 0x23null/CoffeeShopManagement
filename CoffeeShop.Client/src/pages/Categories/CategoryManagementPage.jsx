import React, { useState, useEffect } from 'react';
import { categoryApi } from '../../api/categoryApi';
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
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ name: '', isActive: true });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await categoryApi.getAll();
      if (res && res.data) setCategories(res.data);
    } catch (err) {
      setError(err.message || 'Lỗi tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedId(null);
    setFormData({ name: '', isActive: true });
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setIsEditing(true);
    setSelectedId(c.categoryId);
    setFormData({ name: c.name, isActive: c.isActive });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (isEditing) {
        await categoryApi.update(selectedId, formData);
      } else {
        await categoryApi.create(formData);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      alert(err.message || 'Lỗi lưu danh mục');
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Xóa danh mục "${c.name}"?`)) return;
    try {
      await categoryApi.delete(c.categoryId);
      fetchCategories();
    } catch (err) {
      alert(err.message || 'Lỗi xóa danh mục');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Quản lý danh mục</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus className="size-4 mr-1.5" />
            Thêm danh mục
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading}>
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

      {/* Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Tên danh mục</TableHead>
              <TableHead>Số lượng món</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-center w-30">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="size-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                  Đang tải danh mục...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Chưa có danh mục nào.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.categoryId}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{c.categoryId}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {c.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.productCount || 0} món</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? 'success' : 'destructive'}>
                      {c.isActive ? 'Hoạt động' : 'Ngưng'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEdit(c)}
                        title="Sửa"
                      >
                        <Edit2 className="size-3 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        variant="destructiveOutline"
                        size="xs"
                        onClick={() => handleDelete(c)}
                        title="Xóa"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        maxWidth="max-w-sm"
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
            <Label>Tên danh mục</Label>
            <Input
              type="text"
              placeholder="VD: Cà phê, Trà sữa..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="catActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="size-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
            />
            <label htmlFor="catActive" className="text-xs font-medium text-foreground cursor-pointer select-none">
              Kích hoạt danh mục
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoryManagementPage;
