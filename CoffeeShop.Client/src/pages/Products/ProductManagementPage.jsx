import React, { useState, useEffect } from 'react';
import { productApi } from '../../api/productApi';
import { categoryApi } from '../../api/categoryApi';
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
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const ProductManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    price: '',
    description: '',
    isActive: true,
  });

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAll();
      if (res && res.data) setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        keyword: keyword.trim() || undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        status: status === '' ? undefined : status === 'true',
        pageNumber,
        pageSize,
      };

      const res = await productApi.search(params);
      if (res && res.data) {
        setProducts(res.data.items || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tìm kiếm sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [pageNumber, pageSize]);

  const handleSearch = (e) => {
    e?.preventDefault();
    setPageNumber(1);
    fetchProducts();
  };

  const handleReset = () => {
    setKeyword('');
    setCategoryId('');
    setStatus('');
    setPageNumber(1);
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedProductId(null);
    setFormData({
      categoryId: categories[0]?.categoryId || '',
      name: '',
      price: '',
      description: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setIsEditing(true);
    setSelectedProductId(p.productId);
    setFormData({
      categoryId: p.categoryId,
      name: p.name,
      price: p.price,
      description: p.description || '',
      isActive: p.isActive,
    });
    setModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim() || !formData.categoryId || !formData.price) {
      alert('Vui lòng điền đủ thông tin.');
      return;
    }

    try {
      const payload = {
        categoryId: parseInt(formData.categoryId),
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description?.trim(),
        isActive: Boolean(formData.isActive),
      };

      if (isEditing) {
        await productApi.update(selectedProductId, payload);
      } else {
        await productApi.create(payload);
      }

      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Lỗi lưu sản phẩm');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Xóa món "${p.name}"?`)) return;
    try {
      await productApi.delete(p.productId);
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Lỗi xóa sản phẩm');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Quản lý món ăn</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleOpenAddModal}>
            <Plus className="size-4 mr-1.5" />
            Thêm món
          </Button>
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <Label>Tên món</Label>
            <Input
              type="text"
              placeholder="Nhập tên món..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Danh mục</Label>
            <select
              className="h-8.5 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 shadow-2xs"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Tất cả</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Trạng thái</Label>
            <select
              className="h-8.5 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 shadow-2xs"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="true">Đang bán</option>
              <option value="false">Ngưng bán</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" size="default" className="flex-1">
              <Search className="size-3.5 mr-1.5" />
              Tìm
            </Button>
            <Button type="button" variant="outline" size="default" onClick={handleReset}>
              Xóa
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
              <TableHead>Tên món</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead className="text-right">Đơn giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-center w-30">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="size-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                  Đang tải món ăn...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Không tìm thấy món nào.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.productId}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{p.productId}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {p.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.categoryName}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {p.price.toLocaleString('vi-VN')} đ
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? 'success' : 'destructive'}>
                      {p.isActive ? 'Đang bán' : 'Ngưng bán'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEditModal(p)}
                        title="Sửa"
                      >
                        <Edit2 className="size-3 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        variant="destructiveOutline"
                        size="xs"
                        onClick={() => handleDelete(p)}
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

      {/* Modal Thêm/Sửa */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Sửa món ăn' : 'Thêm món mới'}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button size="sm" onClick={handleSaveProduct}>
              Lưu
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tên món</Label>
            <Input
              type="text"
              placeholder="Nhập tên món ăn..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Danh mục</Label>
            <select
              className="h-8.5 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 shadow-2xs"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Đơn giá (VNĐ)</Label>
            <Input
              type="number"
              placeholder="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="prodActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="size-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
            />
            <label htmlFor="prodActive" className="text-xs font-medium text-foreground cursor-pointer select-none">
              Đang bán (Hiển thị trong POS)
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductManagementPage;
