import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/orderApi';
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
  RotateCw,
  Search,
  Eye,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [orderCode, setOrderCode] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        orderCode: orderCode.trim() || undefined,
        status: status || undefined,
        fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
        toDate: toDate ? new Date(toDate + 'T23:59:59').toISOString() : undefined,
        pageNumber,
        pageSize,
      };

      const res = await orderApi.searchHistory(params);
      if (res && res.data) {
        setOrders(res.data.items || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải lịch sử đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [pageNumber, pageSize]);

  const handleSearch = (e) => {
    e?.preventDefault();
    setPageNumber(1);
    fetchOrders();
  };

  const handleReset = () => {
    setOrderCode('');
    setStatus('');
    setFromDate('');
    setToDate('');
    setPageNumber(1);
  };

  const handleViewDetail = async (orderId) => {
    try {
      const res = await orderApi.getById(orderId);
      if (res && res.data) {
        setSelectedOrder(res.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      alert(err.message || 'Lỗi tải chi tiết');
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Lịch sử đơn hàng</h2>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RotateCw className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Card */}
      <form onSubmit={handleSearch} className="p-4 bg-card rounded-xl border border-border/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <Label>Mã đơn</Label>
            <Input
              type="text"
              placeholder="ORD-..."
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Trạng thái</Label>
            <select
              className="h-8.5 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 shadow-2xs"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="Open">Đang mở (Open)</option>
              <option value="Paid">Đã thanh toán (Paid)</option>
              <option value="Cancelled">Đã hủy (Cancelled)</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label>Từ ngày</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Đến ngày</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
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

      {/* Orders Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Bàn</TableHead>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead className="text-center w-20">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="size-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                  Đang tải đơn hàng...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  Không tìm thấy đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.orderId}>
                  <TableCell className="font-mono font-medium text-foreground">
                    {o.orderCode}
                  </TableCell>
                  <TableCell>{o.tableName}</TableCell>
                  <TableCell>{o.staffName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {o.paidAt ? new Date(o.paidAt).toLocaleString('vi-VN') : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={o.status === 'Paid' ? 'success' : o.status === 'Open' ? 'warning' : 'destructive'}>
                      {o.status === 'Paid' ? 'Đã thanh toán' : o.status === 'Open' ? 'Đang mở' : o.status === 'Cancelled' ? 'Đã hủy' : o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">
                    {o.totalAmount.toLocaleString('vi-VN')} đ
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleViewDetail(o.orderId)}
                    >
                      <Eye className="size-3 mr-1" />
                      Xem
                    </Button>
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

      {/* Modal Chi tiết đơn hàng */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Chi tiết đơn: ${selectedOrder?.orderCode || ''}`}
        maxWidth="max-w-lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setDetailModalOpen(false)}>
            Đóng
          </Button>
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs grid grid-cols-2 gap-2">
              <div>Bàn: <strong className="text-foreground">{selectedOrder.tableName}</strong></div>
              <div>Nhân viên: <strong className="text-foreground">{selectedOrder.staffName}</strong></div>
              <div>
                Trạng thái:{' '}
                <Badge variant={selectedOrder.status === 'Paid' ? 'success' : 'warning'} className="ml-1">
                  {selectedOrder.status}
                </Badge>
              </div>
              <div>
                Thời gian: <span className="text-muted-foreground">{new Date(selectedOrder.createdAt).toLocaleTimeString('vi-VN')}</span>
              </div>
            </div>

            <div className="rounded-lg border border-border/80 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-2">Món</TableHead>
                    <TableHead className="py-2 text-center">SL</TableHead>
                    <TableHead className="py-2 text-right">Đơn giá</TableHead>
                    <TableHead className="py-2 text-right">Tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items?.map((it) => (
                    <TableRow key={it.orderDetailId}>
                      <TableCell className="py-2 font-medium">{it.productName}</TableCell>
                      <TableCell className="py-2 text-center font-semibold">{it.quantity}</TableCell>
                      <TableCell className="py-2 text-right text-xs text-muted-foreground">
                        {it.unitPrice.toLocaleString('vi-VN')} đ
                      </TableCell>
                      <TableCell className="py-2 text-right font-medium text-foreground">
                        {it.lineTotal.toLocaleString('vi-VN')} đ
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center px-1 text-sm pt-2 border-t border-border/60">
              <span className="font-medium text-muted-foreground">Tổng cộng:</span>
              <span className="text-base font-bold text-foreground">
                {selectedOrder.totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderHistoryPage;
