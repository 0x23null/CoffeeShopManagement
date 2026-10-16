import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground leading-none">Xin chào,</span>
          <span className="text-sm font-semibold text-foreground leading-tight">
            {user?.fullName || user?.username || 'Admin'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge
          variant={user?.role === 'Admin' ? 'default' : 'secondary'}
          className="capitalize text-xs font-medium"
        >
          {user?.role || 'Staff'}
        </Badge>

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-3.5 mr-1.5" />
          Đăng xuất
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
