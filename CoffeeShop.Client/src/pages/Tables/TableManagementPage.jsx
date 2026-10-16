import React, { useState, useEffect } from 'react';
import { tableApi } from '../../api/tableApi';
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

export const TableManagementPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ tableName: '', status: 'Available', isActive: true });

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await tableApi.getAll();
      if (res && res.data) setTables(res.data);
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách bàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedId(null);
    setFormData({ tableName: '', status: 'Available', isActive: true });
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setIsEditing(true);
    setSelectedId(t.tableId);
    setFormData({ tableName: t.tableName, status: t.status, isActive: t.isActive });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!formData.tableName.trim()) return;

    try {
      if (isEditing) {
        await tableApi.update(selectedId, formData);
      } else {
        await tableApi.create(formData);
      }
      setModalOpen(false);
      fetchTables();
    } catch (err) {
      alert(err.message || 'Lỗi lưu bàn');
    }
  };

  const handleDelete = async (t) => {
    if (t.status === 'Occupied') {
      alert('Không thể xóa bàn đang có khách!');
      return;
    }
    if (!window.confirm(`Xóa bàn "${t.tableName}"?`)) return;
    try {
      await tableApi.delete(t.tableId);
      fetchTables();
    } catch (err) {
      alert(err.message || 'Lỗi xóa bàn');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Quản lý sơ đồ bàn</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus className="size-4 mr-1.5" />
            Thêm bàn
          </Button>
          <Button variant="outline" size="sm" onClick={fetchTables} disabled={loading}>
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
              <TableHead>Tên bàn</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Kích hoạt</TableHead>
              <TableHead className="text-center w-30">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="size-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                  Đang tải danh sách bàn...
                </TableCell>
              </TableRow>
            ) : tables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Chưa có bàn nào.
                </TableCell>
              </TableRow>
            ) : (
              tables.map((t) => (
                <TableRow key={t.tableId}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{t.tableId}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {t.tableName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'Occupied' ? 'destructive' : 'success'}>
                      {t.status === 'Occupied' ? 'Có khách' : 'Trống'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.isActive ? 'outline' : 'secondary'}>
                      {t.isActive ? 'Đang dùng' : 'Khóa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEdit(t)}
                        title="Sửa"
                      >
                        <Edit2 className="size-3 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        variant="destructiveOutline"
                        size="xs"
                        onClick={() => handleDelete(t)}
                        disabled={t.status === 'Occupied'}
                        title={t.status === 'Occupied' ? 'Không thể xóa bàn có khách' : 'Xóa'}
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

      {/* Modal Thêm/Sửa */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Sửa thông tin bàn' : 'Thêm bàn mới'}
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
            <Label>Tên bàn</Label>
            <Input
              type="text"
              placeholder="VD: Bàn 01, VIP 1..."
              value={formData.tableName}
              onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Trạng thái</Label>
            <select
              className="h-8.5 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 shadow-2xs"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Available">Trống (Available)</option>
              <option value="Occupied">Có khách (Occupied)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="tableActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="size-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
            />
            <label htmlFor="tableActive" className="text-xs font-medium text-foreground cursor-pointer select-none">
              Kích hoạt bàn
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TableManagementPage;
