import { useEffect, useState } from 'react';
import { getProjects, saveProject, deleteProject, Project } from '@/lib/indexedDB';
import { getSession } from '@/lib/authStore';
import { authGetUsers, authUpdateUser, AuthGetUsersOutputType } from 'zite-endpoints-sdk';
import Header from '@/components/layout/Header';
import ProjectForm from '@/components/admin/ProjectForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, Database, Users, Shield, CheckCircle2, XCircle, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

type UserRecord = AuthGetUsersOutputType['users'][0];

export default function AdminPage() {
  const session = getSession();
  // Role-based admin check (supports multiple admins)
  const isAdmin = session?.role === 'admin';

  const [tab, setTab] = useState<'projects' | 'users'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = () => getProjects().then(setProjects);

  const loadUsers = async () => {
    if (!session?.email) return;
    setUsersLoading(true);
    try {
      const result = await authGetUsers({ requesterEmail: session.email });
      if (result.success) setUsers(result.users);
    } catch { /* silently fail */ }
    setUsersLoading(false);
  };

  useEffect(() => {
    if (tab === 'users' && isAdmin) loadUsers();
  }, [tab]);

  // Guard: only admins can modify projects
  const requireAdmin = (action: string): boolean => {
    if (!isAdmin) {
      toast.error(`Only Admins are allowed to ${action} the Project`);
      return false;
    }
    return true;
  };

  const handleAddClick = () => {
    if (!requireAdmin('Add')) return;
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEditClick = (p: Project) => {
    if (!requireAdmin('Edit')) return;
    setEditing(p);
    setDialogOpen(true);
  };

  const handleSave = async (data: Omit<Project, 'id' | 'createdAt'>) => {
    if (!requireAdmin(editing ? 'Edit' : 'Add')) return;
    const project: Project = editing
      ? { ...editing, ...data }
      : { id: '', createdAt: 0, ...data };
    await saveProject(project);
    await loadProjects();
    setDialogOpen(false);
    setEditing(null);
    toast.success(editing ? 'Project updated successfully' : 'Project added successfully');
  };

  const handleDeleteProject = async (id: string) => {
    if (!requireAdmin('Delete')) return;
    await deleteProject(id);
    await loadProjects();
    toast.success('Project deleted');
  };

  const handleUserAction = async (userId: string, action: 'enable' | 'disable' | 'delete' | 'makeAdmin' | 'removeAdmin') => {
    if (!session?.email) return;
    try {
      await authUpdateUser({ requesterEmail: session.email, userId, action });
      const label = action === 'delete' ? 'deleted' : action === 'makeAdmin' ? 'promoted to Admin' : action === 'removeAdmin' ? 'changed to User' : `${action}d`;
      toast.success(`User ${label}`);
      await loadUsers();
    } catch {
      toast.error('Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <Header />
      <main className="container mx-auto px-6 py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground">Admin Panel</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage projects and users</p>
          </div>
          {tab === 'projects' && (
            <Button onClick={handleAddClick} className="gap-2">
              <Plus className="w-4 h-4" /> Add Project
            </Button>
          )}
        </div>

        {/* Tabs — visible to all, but Users tab only useful for admins */}
        <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab('projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'projects' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Database className="w-4 h-4" /> Projects
          </button>
          {isAdmin && (
            <button
              onClick={() => setTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'users' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Users className="w-4 h-4" /> Users
            </button>
          )}
        </div>

        {/* Projects Tab */}
        {tab === 'projects' && (
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="rounded-2xl border-2 border-border bg-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      Sheet: {p.sheetName} &nbsp;|&nbsp; ID: {p.sheetId.slice(0, 24)}…
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(p)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {isAdmin ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{p.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete the project. This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProject(p.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => requireAdmin('Delete')}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No projects yet. Click "Add Project" to get started.
              </div>
            )}
          </div>
        )}

        {/* Users Tab (admin only) */}
        {tab === 'users' && isAdmin && (
          <div className="space-y-3">
            {usersLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading users…</div>
            ) : users.map(u => (
              <div key={u.id} className="rounded-2xl border-2 border-border bg-card p-4 flex items-center justify-between gap-4 flex-wrap gap-y-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    {u.role === 'admin' ? <Shield className="w-5 h-5 text-primary" /> : <Users className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-foreground truncate">{u.fullName || u.email}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        {u.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email} {u.mobile ? `· ${u.mobile}` : ''}</p>
                  </div>
                </div>

                {/* Don't show actions for yourself */}
                {u.email?.toLowerCase() !== session?.email?.toLowerCase() && (
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    {/* Role toggle */}
                    {u.role === 'admin' ? (
                      <Button variant="outline" size="sm" onClick={() => handleUserAction(u.id, 'removeAdmin')} className="gap-1 text-xs">
                        <ShieldOff className="w-3.5 h-3.5" /> Remove Admin
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleUserAction(u.id, 'makeAdmin')} className="gap-1 text-xs text-primary">
                        <Shield className="w-3.5 h-3.5" /> Make Admin
                      </Button>
                    )}

                    {/* Status toggle */}
                    {u.status === 'active' ? (
                      <Button variant="outline" size="sm" onClick={() => handleUserAction(u.id, 'disable')} className="gap-1 text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Disable
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleUserAction(u.id, 'enable')} className="gap-1 text-xs text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enable
                      </Button>
                    )}

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete user "{u.email}"?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete the user account. This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleUserAction(u.id, 'delete')} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
            {!usersLoading && users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No users found.</div>
            )}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Project' : 'Add New Project'}</DialogTitle>
          </DialogHeader>
          <ProjectForm initial={editing ?? undefined} onSave={handleSave} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
