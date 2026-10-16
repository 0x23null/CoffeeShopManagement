import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Store,
  ReceiptText,
  Coffee,
  FolderTree,
  Armchair,
  Users,
} from "lucide-react";

export const Sidebar = () => {
  const { isAdmin } = useAuth();

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-neutral-900 text-white shadow-xs"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0 select-none">
      <div className="h-16 border-b border-border px-6 flex items-center gap-3">
        <div className="flex flex-col">
          <h2 className="font-semibold leading-tight text-foreground">
            Coffee Shop
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Management System
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Section: Menu */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Menu
          </div>
          <nav className="space-y-1">
            {isAdmin && (
              <NavLink to="/dashboard" className={navItemClass}>
                <LayoutDashboard className="size-4 shrink-0" />
                <span>Báo cáo & Thống kê</span>
              </NavLink>
            )}

            <NavLink to="/pos" className={navItemClass}>
              <Store className="size-4 shrink-0" />
              <span>Sơ đồ bàn (POS)</span>
            </NavLink>

            <NavLink to="/orders/history" className={navItemClass}>
              <ReceiptText className="size-4 shrink-0" />
              <span>Lịch sử đơn</span>
            </NavLink>
          </nav>
        </div>

        {/* Section: Quản trị (Chỉ dành cho Admin) */}
        {isAdmin && (
          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Quản trị
            </div>
            <nav className="space-y-1">
              <NavLink to="/products" className={navItemClass}>
                <Coffee className="size-4 shrink-0" />
                <span>Sản phẩm</span>
              </NavLink>

              <NavLink to="/categories" className={navItemClass}>
                <FolderTree className="size-4 shrink-0" />
                <span>Danh mục</span>
              </NavLink>

              <NavLink to="/tables" className={navItemClass}>
                <Armchair className="size-4 shrink-0" />
                <span>Quản lý bàn</span>
              </NavLink>

              <NavLink to="/users" className={navItemClass}>
                <Users className="size-4 shrink-0" />
                <span>Tài khoản</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
