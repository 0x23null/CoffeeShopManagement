import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableApi } from '../../api/tableApi';
import { orderApi } from '../../api/orderApi';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const PosPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [selectedTable, setSelectedTable] = useState(null);
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const navigate = useNavigate();

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await tableApi.getAll();
      if (res && res.data) setTables(res.data);
    } catch (err) {
      setError(err.message || 'Không thể tải bàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleTableClick = (table) => {
    if (table.status === 'Occupied' && table.currentOrderId) {
      navigate(`/orders/${table.currentOrderId}`);
    } else {
      setSelectedTable(table);
      setOpenModalVisible(true);
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedTable) return;
    try {
      setCreatingOrder(true);
      const res = await orderApi.create(selectedTable.tableId);
      if (res && res.data) {
        setOpenModalVisible(false);
        navigate(`/orders/${res.data.orderId}`);
      }
    } catch (err) {
      alert(err.message || 'Lỗi mở bàn');
    } finally {
      setCreatingOrder(false);
    }
  };

  const filteredTables = tables.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  const availableCount = tables.filter((t) => t.status === 'Available').length;
  const occupiedCount = tables.filter((t) => t.status === 'Occupied').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Sơ đồ bàn (POS)</h2>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterStatus === 'ALL'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/80'
          }`}
        >
          Tất cả ({tables.length})
        </button>
        <button
          onClick={() => setFilterStatus('Available')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterStatus === 'Available'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/80'
          }`}
        >
          Bàn trống ({availableCount})
        </button>
        <button
          onClick={() => setFilterStatus('Occupied')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterStatus === 'Occupied'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/80'
          }`}
        >
          Có khách ({occupiedCount})
        </button>
      </div>

      {/* Grid of Tables */}
      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">
          <Loader2 className="size-6 animate-spin mx-auto mb-2 text-muted-foreground" />
          Đang tải danh sách bàn...
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground bg-card rounded-xl border border-border/80">
          Không tìm thấy bàn phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredTables.map((table) => {
            const isOccupied = table.status === 'Occupied';
            return (
              <div
                key={table.tableId}
                onClick={() => handleTableClick(table)}
                className={`group relative rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-35 border shadow-2xs hover:shadow-md ${
                  isOccupied
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300 dark:bg-rose-950/20 dark:border-rose-900/50'
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {table.tableName}
                    </span>
                    <Badge variant={isOccupied ? 'destructive' : 'success'}>
                      {isOccupied ? 'Có khách' : 'Trống'}
                    </Badge>
                  </div>

                  {isOccupied ? (
                    <div className="space-y-1 my-2">
                      <div className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/60">
                        <span>{table.currentOrderCode}</span>
                      </div>
                      <div className="text-base font-bold text-rose-600 dark:text-rose-400">
                        {(table.currentOrderTotal || 0).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  ) : (
                    <div className="my-3 text-xs text-muted-foreground/70 flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      <span>Sẵn sàng phục vụ</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className={`font-medium ${isOccupied ? 'text-rose-600' : 'text-primary'}`}>
                    {isOccupied ? 'Xem đơn hàng' : '+ Mở bàn'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Mở bàn */}
      <Modal
        isOpen={openModalVisible}
        onClose={() => setOpenModalVisible(false)}
        title={`Mở bàn: ${selectedTable?.tableName}`}
        maxWidth="max-w-sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpenModalVisible(false)}>
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleCreateOrder}
              disabled={creatingOrder}
            >
              {creatingOrder ? 'Đang tạo...' : 'Xác nhận mở bàn'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Tạo đơn hàng mới cho <strong className="text-foreground">{selectedTable?.tableName}</strong>?
        </p>
      </Modal>
    </div>
  );
};

export default PosPage;
