import { useState, useMemo } from "react";
import { Search, Edit, Trash2, UserPlus, Mail, Phone, Building, Calendar, Package } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { mockOrders } from "../data/orders";

// Extended user type with orders
interface UserWithOrders {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  phone?: string;
  company?: string;
  createdAt: string;
  orders: Array<{
    id: string;
    timestamp: string;
    total: number;
    status: 'delivered' | 'pending' | 'cancelled';
  }>;
}

// Mock users with orders
const generateMockUsers = (): UserWithOrders[] => {
  const users: UserWithOrders[] = [
    {
      id: '1',
      email: 'admin@betterme.com',
      name: 'Admin User',
      role: 'admin',
      phone: '(555) 000-0000',
      company: 'BetterMe Drone Delivery',
      createdAt: '2024-01-15T10:00:00',
      orders: [],
    },
    {
      id: '2',
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user',
      phone: '(555) 111-2222',
      company: 'Example Corp',
      createdAt: '2024-02-20T14:30:00',
      orders: [],
    },
    {
      id: '3',
      email: 'sarah.chen@techstartup.com',
      name: 'Sarah Chen',
      role: 'user',
      phone: '(555) 234-5678',
      company: 'Tech Startup Inc',
      createdAt: '2024-11-01T09:15:00',
      orders: [],
    },
    {
      id: '4',
      email: 'john.doe@retail.com',
      name: 'John Doe',
      role: 'user',
      phone: '(555) 345-6789',
      company: 'Retail Solutions',
      createdAt: '2024-10-15T16:45:00',
      orders: [],
    },
    {
      id: '5',
      email: 'maria.garcia@logistics.com',
      name: 'Maria Garcia',
      role: 'user',
      phone: '(555) 456-7890',
      company: 'Logistics Pro',
      createdAt: '2024-09-10T11:20:00',
      orders: [],
    },
  ];

  // Distribute mock orders among users
  const statuses: Array<'delivered' | 'pending' | 'cancelled'> = ['delivered', 'delivered', 'delivered', 'pending', 'cancelled'];
  mockOrders.forEach((order, index) => {
    const userIndex = (index % (users.length - 1)) + 1; // Skip admin user
    users[userIndex].orders.push({
      id: order.id,
      timestamp: order.timestamp,
      total: order.total,
      status: statuses[index % statuses.length],
    });
  });

  return users;
};

export function UserManagement() {
  const [users, setUsers] = useState<UserWithOrders[]>(generateMockUsers());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithOrders | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserWithOrders>>({});

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.company?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleEditUser = (user: UserWithOrders) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company,
      role: user.role,
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;

    const updatedUsers = users.map(user => 
      user.id === selectedUser.id 
        ? { ...user, ...editForm }
        : user
    );

    setUsers(updatedUsers);
    setEditDialogOpen(false);
    toast.success(`User ${editForm.name} updated successfully`);
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.role === 'admin') {
      toast.error("Cannot delete admin users");
      return;
    }

    if (confirm(`Are you sure you want to delete user ${user.name}?`)) {
      setUsers(users.filter(u => u.id !== userId));
      toast.success(`User ${user.name} deleted successfully`);
    }
  };

  const getUserStats = (user: UserWithOrders) => {
    const totalSpent = user.orders.reduce((sum, order) => sum + order.total, 0);
    const deliveredOrders = user.orders.filter(o => o.status === 'delivered').length;
    return { totalSpent, deliveredOrders, totalOrders: user.orders.length };
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Search, view, and manage user accounts and their order history
        </p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add User</span>
            </Button>
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-3">
              Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const stats = getUserStats(user);
          
          return (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 mb-1">
                      {user.name}
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {user.role}
                      </Badge>
                    </CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.company && (
                        <div className="flex items-center gap-2">
                          <Building className="h-3 w-3" />
                          <span className="truncate">{user.company}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Order Statistics */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Orders</div>
                    <div className="font-bold">{stats.totalOrders}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Delivered</div>
                    <div className="font-bold text-green-600">{stats.deliveredOrders}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total</div>
                    <div className="font-bold">${stats.totalSpent.toFixed(2)}</div>
                  </div>
                </div>

                {/* Recent Orders */}
                {user.orders.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Package className="h-3 w-3" />
                      Recent Orders
                    </div>
                    <div className="space-y-1.5">
                      {user.orders.slice(0, 3).map(order => (
                        <div key={order.id} className="flex items-center justify-between text-xs p-2 bg-muted/20 rounded">
                          <span className="font-mono">{order.id}</span>
                          <Badge 
                            variant={order.status === 'delivered' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}
                            className="text-[10px] h-5"
                          >
                            {order.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.role === 'admin'}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No users found matching "{searchQuery}"</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-company">Company</Label>
              <Input
                id="edit-company"
                value={editForm.company || ''}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select 
                value={editForm.role} 
                onValueChange={(value: 'admin' | 'user') => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
