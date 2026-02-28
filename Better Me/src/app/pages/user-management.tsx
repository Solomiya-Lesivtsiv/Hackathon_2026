import { useState, useEffect, useMemo } from "react";
import { Search, Edit, Trash2, UserPlus, Mail, Phone, Building, Calendar, Package, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { apiGetUsers, apiUpdateUser, apiDeleteUser, type UserWithStats } from "../services/api";

export function UserManagement() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserWithStats>>({});

  const loadUsers = () => {
    setLoading(true);
    apiGetUsers()
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.company || "").toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const handleEditUser = (user: UserWithStats) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone, company: user.company, role: user.role });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    try {
      await apiUpdateUser(selectedUser.id, editForm);
      setEditDialogOpen(false);
      toast.success(`User ${editForm.name} updated successfully`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleDeleteUser = async (user: UserWithStats) => {
    if (user.role === 'admin') { toast.error("Cannot delete admin users"); return; }
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      await apiDeleteUser(user.id);
      toast.success(`User ${user.name} deleted`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="mb-2">User Management</h1>
        <p className="text-muted-foreground">Search, view, and manage user accounts and their order history</p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, or company..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
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
        {filteredUsers.map(user => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2 mb-1">
                  {user.name}
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">{user.role}</Badge>
                  {!user.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                </CardTitle>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Mail className="h-3 w-3" /><span className="truncate">{user.email}</span></div>
                  {user.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" /><span>{user.phone}</span></div>}
                  {user.company && <div className="flex items-center gap-2"><Building className="h-3 w-3" /><span className="truncate">{user.company}</span></div>}
                  <div className="flex items-center gap-2"><Calendar className="h-3 w-3" /><span>Joined {new Date(user.createdAt).toLocaleDateString()}</span></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Orders</div>
                  <div className="font-bold">{user.totalOrders}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Spent</div>
                  <div className="font-bold">${user.totalSpent.toFixed(2)}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleEditUser(user)}>
                  <Edit className="h-3 w-3" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleDeleteUser(user)} disabled={user.role === 'admin'}>
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card><CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{searchQuery ? `No users found matching "${searchQuery}"` : "No users yet"}</p>
          </div>
        </CardContent></Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1.5" /></div>
            <div><Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="mt-1.5" /></div>
            <div><Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="mt-1.5" /></div>
            <div><Label htmlFor="edit-company">Company</Label>
              <Input id="edit-company" value={editForm.company || ''} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className="mt-1.5" /></div>
            <div><Label htmlFor="edit-role">Role</Label>
              <Select value={editForm.role} onValueChange={(v: 'admin' | 'user') => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
              </Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUser} className="bg-primary hover:bg-primary/90">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
