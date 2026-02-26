import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Package, 
  Upload, 
  PlusCircle, 
  Menu, 
  LogOut, 
  ChevronLeft,
  Plane
} from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";

export function DashboardLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/orders", label: "Orders List", icon: Package },
    { path: "/import", label: "Import CSV", icon: Upload },
    { path: "/create", label: "Create Order", icon: PlusCircle },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Sidebar - Desktop */}
      <aside
        className={`${
          sidebarExpanded ? "w-64" : "w-20"
        } bg-card border-r border-border transition-all duration-300 flex-col fixed left-0 top-0 h-full z-50 hidden lg:flex`}
      >
        {/* Logo & Toggle */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4">
          {sidebarExpanded ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-foreground">BetterMe</span>
                <span className="text-[10px] text-muted-foreground -mt-1">Tax Admin</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center mx-auto">
              <Plane className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          {sidebarExpanded && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarExpanded(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors relative ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarExpanded && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Expand Button (when collapsed) */}
        {!sidebarExpanded && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-10"
              onClick={() => setSidebarExpanded(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 pb-16 lg:pb-0 ${
          sidebarExpanded ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between lg:justify-end px-4 lg:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-sm">BetterMe</span>
              <span className="text-[9px] text-muted-foreground -mt-1">Tax Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@betterme.com</p>
            </div>
            <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                AU
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}