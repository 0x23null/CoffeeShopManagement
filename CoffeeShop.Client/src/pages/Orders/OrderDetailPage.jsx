import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import { productApi } from '../../api/productApi';
import { categoryApi } from '../../api/categoryApi';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Search,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  Loader2,
  XCircle,
} from 'lucide-react';

export const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await orderApi.getById(id);
      if (res && res.data) setOrder(res.data);
    } catch (err) {
      setError(err.message || 'Lỗi tải hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAll(true);
      if (res && res.data) setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await productApi.search({
        keyword: searchKeyword,
        categoryId: selectedCategoryId,
        status: true,
        pageNumber: 1,
        pageSize: 100,
      });
      if (res && res.data) setProducts(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchCategories();
  }, [id]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategoryId, searchKeyword]);

  const handleAddItem = async (product) => {
    if (order?.status !== 'Open') {
      alert('Đơn hàng đã thanh toán hoặc đã đóng.');
      return;
    }

    const existing = order.items.find((x) => x.productId === product.productId);
    const newQty = existing ? existing.quantity + 1 : 1;

    try {
      const res = await orderApi.addOrUpdateItem(order.orderId, product.productId, newQty);
      if (res && res.data) setOrder(res.data);
    } catch (err) {
      alert(err.message || 'Lỗi thêm món');
    }
  };

  const handleUpdateQuantity = async (productId, currentQty, delta) => {
    if (order?.status !== 'Open') return;
    const newQty = currentQty + delta;
    try {
      if (newQty <= 0) {
        await handleRemoveItem(productId);
      } else {
        const res = await orderApi.addOrUpdateItem(order.orderId, productId, newQty);
        if (res && res.data) setOrder(res.data);
      }
    } catch (err) {
      alert(err.message || 'Lỗi đổi số lượng');
    }
  };

  const handleRemoveItem = async (productId) => {
    if (order?.status !== 'Open') return;
    if (!window.confirm('Xóa món này khỏi đơn?')) return;
    try {
      const res = await orderApi.removeItem(order.orderId, productId);
      if (res && res.data) setOrder(res.data);
    } catch (err) {
      alert(err.message || 'Lỗi xóa món');
    }
  };

  const openPaymentModal = () => {
    setPaymentMethod('Cash');
    setPaymentModalOpen(true);
  };

  const handleProcessPayment = async () => {
    try {
      setPaymentLoading(true);
      await orderApi.processPayment(order.orderId, {
        paymentMethod,
        amount: order.totalAmount,
      });

      alert('Thanh toán thành công!');
      navigate('/pos');
    } catch (err) {
      alert(err.message || 'Thanh toán thất bại');
    } finally {
      setPaymentLoading(false);
    }
  };

  const [cancelling, setCancelling] = useState(false);

  const handleCancelOrder = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${order.orderCode}?\nBàn "${order.tableName}" sẽ được giải phóng.`)) {
      return;
    }

    try {
      setCancelling(true);
      await orderApi.cancel(order.orderId);
      alert('Đã hủy đơn hàng thành công! Bàn đã được giải phóng.');
      navigate('/pos');
    } catch (err) {
      alert(err.message || 'Lỗi hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  const isOpen = order?.status === 'Open';
  const totalAmount = order?.totalAmount || 0;

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground">
        <Loader2 className="size-6 animate-spin mx-auto mb-2 text-muted-foreground" />
        Đang tải chi tiết hóa đơn...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-center gap-2">
        <AlertCircle className="size-4 shrink-0" />
        <span>{error || 'Không tìm thấy hóa đơn'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card rounded-xl border border-border/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/pos')}>
            <ArrowLeft className="size-4 mr-1.5" />
            Sơ đồ bàn
          </Button>

          <div className="h-4 w-px bg-border/80" />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">{order.tableName}</h2>
              <span className="text-xs font-mono text-muted-foreground">({order.orderCode})</span>
              <Badge variant={isOpen ? 'warning' : order.status === 'Cancelled' ? 'destructive' : 'success'}>
                {isOpen ? 'Đang phục vụ' : order.status === 'Cancelled' ? 'Đã hủy' : 'Đã thanh toán'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="size-3.5" />
            <span>NV: <strong className="text-foreground">{order.staffName}</strong></span>
          </div>
          <div className="h-3 w-px bg-border/80" />
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>Giờ vào: <strong className="text-foreground">{new Date(order.createdAt).toLocaleTimeString('vi-VN')}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Menu Items Catalog */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-4 bg-card rounded-xl border border-border/80 shadow-2xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm món theo tên..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  selectedCategoryId === null
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.categoryId}
                  onClick={() => setSelectedCategoryId(cat.categoryId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    selectedCategoryId === cat.categoryId
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="p-4 bg-card rounded-xl border border-border/80 shadow-2xs">
            {productsLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <Loader2 className="size-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                Đang tìm món...
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Không tìm thấy món phù hợp.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.map((p) => (
                  <div
                    key={p.productId}
                    onClick={() => isOpen && handleAddItem(p)}
                    className={`p-3 rounded-xl border border-border/80 bg-background/50 hover:bg-card hover:border-primary/40 transition-all duration-150 flex flex-col justify-between gap-2 shadow-2xs ${
                      isOpen ? 'cursor-pointer hover:shadow-xs' : 'opacity-80 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        {p.categoryName}
                      </span>
                      <h4 className="text-sm font-semibold text-foreground line-clamp-1 mt-0.5">
                        {p.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-xs font-bold text-foreground">
                        {p.price.toLocaleString('vi-VN')} đ
                      </span>
                      {isOpen && (
                        <span className="size-6 rounded-md bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-2xs">
                          <Plus className="size-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Bill Panel */}
        <div className="lg:col-span-5">
          <div className="p-5 bg-card rounded-xl border border-border/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <span className="text-sm font-bold text-foreground">
                Chi tiết đơn hàng
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {order.items.length} món
              </span>
            </div>

            {/* Bill Items List */}
            <div className="space-y-2 max-h-90 overflow-y-auto pr-1">
              {order.items.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Chưa chọn món nào. Bấm vào món bên trái để thêm vào đơn.
                </div>
              ) : (
                order.items.map((item) => (
                  <div
                    key={item.productId}
                    className="p-3 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {item.unitPrice.toLocaleString('vi-VN')} đ
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isOpen ? (
                        <div className="flex items-center border border-border rounded-lg bg-card shadow-2xs">
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity, -1)}
                            className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity, 1)}
                            className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-foreground px-2">
                          x{item.quantity}
                        </span>
                      )}

                      <span className="text-xs font-bold text-foreground min-w-17.5 text-right">
                        {item.lineTotal.toLocaleString('vi-VN')} đ
                      </span>

                      {isOpen && (
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Xóa món"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bill Summary & Payment */}
            <div className="pt-3 border-t border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tổng cộng:</span>
                <span className="text-lg font-bold text-foreground">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>

              {isOpen ? (
                <div className="space-y-2">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
                    size="lg"
                    disabled={order.items.length === 0}
                    onClick={openPaymentModal}
                  >
                    <CreditCard className="size-4 mr-2" />
                    Thanh toán
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 cursor-pointer"
                    size="sm"
                    disabled={cancelling}
                    onClick={handleCancelOrder}
                  >
                    <XCircle className="size-4 mr-1.5" />
                    {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                  </Button>
                </div>
              ) : order.status === 'Cancelled' ? (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium text-center flex items-center justify-center gap-1.5 border border-destructive/20">
                  <XCircle className="size-4" />
                  <span>Đơn hàng đã bị hủy</span>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  <span>Đã thanh toán ({order.paidAt ? new Date(order.paidAt).toLocaleTimeString('vi-VN') : 'Đã tất toán'})</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Thanh toán */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => !paymentLoading && setPaymentModalOpen(false)}
        title={`Thanh toán đơn ${order.orderCode}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentModalOpen(false)}
              disabled={paymentLoading}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleProcessPayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận thanh toán'
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bàn:</span>
              <strong className="text-foreground">{order.tableName}</strong>
            </div>
            <div className="flex justify-between text-sm pt-1 border-t border-border/40">
              <span className="text-muted-foreground">Cần thanh toán:</span>
              <strong className="text-base text-emerald-600 font-bold">
                {totalAmount.toLocaleString('vi-VN')} đ
              </strong>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Hình thức thanh toán:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'Cash'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-semibold shadow-2xs'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <Banknote className="size-4" />
                <span>Tiền mặt</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Transfer')}
                className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'Transfer'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-semibold shadow-2xs'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <CreditCard className="size-4" />
                <span>Chuyển khoản</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetailPage;
