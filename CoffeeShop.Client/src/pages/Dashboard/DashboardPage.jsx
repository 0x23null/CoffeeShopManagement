import React, { useState, useEffect } from 'react';
import { reportApi } from '../../api/reportApi';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
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
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Armchair,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const [sumRes, topRes] = await Promise.all([
        reportApi.getSummary(),
        reportApi.getTopProducts(5),
      ]);

      if (sumRes && sumRes.data) setSummary(sumRes.data);
      if (topRes && topRes.data) setTopProducts(topRes.data);
    } catch (err) {
      setError(err.message || 'Lỗi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground">
        <Loader2 className="size-6 animate-spin mx-auto mb-2 text-muted-foreground" />
        Đang tải báo cáo thống kê...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Báo cáo & Thống kê</h2>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
          <RotateCw className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Cập nhật
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="p-4 shadow-2xs border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng doanh thu</span>
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-foreground">
              {(summary?.totalRevenue || 0).toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {summary?.totalOrders || 0} đơn đã thanh toán
            </p>
          </div>
        </Card>

        <Card className="p-4 shadow-2xs border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Doanh thu hôm nay</span>
            <div className="size-8 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-foreground">
              {(summary?.todayRevenue || 0).toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {summary?.todayOrders || 0} đơn trong ngày
            </p>
          </div>
        </Card>

        <Card className="p-4 shadow-2xs border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Giá trị đơn TB</span>
            <div className="size-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
              <ShoppingBag className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-foreground">
              {(summary?.averageOrderValue || 0).toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Trung bình mỗi đơn
            </p>
          </div>
        </Card>

        <Card className="p-4 shadow-2xs border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Bàn đang phục vụ</span>
            <div className="size-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center">
              <Armchair className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
              {summary?.occupiedTables || 0} / {summary?.activeTables || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Bàn đang có khách
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Recent 7 Days Table */}
        <Card className="p-5 shadow-2xs border-border/80 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/80">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Doanh thu 7 ngày gần đây</h3>
            </div>
          </div>

          <div className="rounded-lg border border-border/80 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead className="text-center">Số đơn</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!summary?.revenueByDate || summary.revenueByDate.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-xs text-muted-foreground">
                      Chưa có dữ liệu 7 ngày qua.
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.revenueByDate.map((d) => (
                    <TableRow key={d.date}>
                      <TableCell className="font-mono text-xs">{d.date}</TableCell>
                      <TableCell className="text-center font-medium">{d.ordersCount}</TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {d.revenue.toLocaleString('vi-VN')} đ
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-5 shadow-2xs border-border/80 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/80">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Top 5 món bán chạy nhất</h3>
            </div>
          </div>

          <div className="rounded-lg border border-border/80 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12.5">Hạng</TableHead>
                  <TableHead>Tên món</TableHead>
                  <TableHead className="text-center">Đã bán</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                      Chưa có dữ liệu món bán chạy.
                    </TableCell>
                  </TableRow>
                ) : (
                  topProducts.map((p, idx) => (
                    <TableRow key={p.productId}>
                      <TableCell className="font-bold text-xs text-muted-foreground">
                        <span className={`inline-flex items-center justify-center size-5 rounded-full text-[10px]`}>
                          #{idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {p.productName}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {p.totalQuantitySold}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {p.totalRevenue.toLocaleString('vi-VN')} đ
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
