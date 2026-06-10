import { useState } from 'react'
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser, usePendingUsers, useApproveUser } from '../../api/admin'
import type { User } from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { useUiStore } from '../../store/uiStore'

const roleOptions = [
  { value: 'Admin', label: 'Administrador' },
  { value: 'Editor', label: 'Editor' },
  { value: 'Viewer', label: 'Lector' },
]

const roleAvatarColors: Record<string, string> = {
  Admin: 'bg-iupa-green',
  Editor: 'bg-dept-music',
  Viewer: 'bg-iupa-medium',
}

export default function UsersAdmin() {
  const { data: users, isLoading, isError, error } = useUsers()
  const { data: pendingUsers, isLoading: pendingLoading } = usePendingUsers()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deactivateMutation = useDeactivateUser()
  const approveMutation = useApproveUser()
  const addToast = useUiStore((s) => s.addToast)

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)

  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<User['role']>('Reader')

  const [editRole, setEditRole] = useState<User['role']>('Reader')
  const [editActive, setEditActive] = useState(true)

  const resetForm = () => {
    setNewEmail('')
    setNewPassword('')
    setNewName('')
    setNewRole('Reader')
  }

  const handleCreate = async () => {
    if (!newEmail.trim() || !newPassword.trim() || !newName.trim()) return
    try {
      await createMutation.mutateAsync({
        email: newEmail.trim(),
        fullName: newName.trim(),
        password: newPassword,
        role: newRole,
      })
      addToast('success', 'Usuario creado exitosamente')
      setCreateOpen(false)
      resetForm()
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error al crear usuario')
    }
  }

  const handleEdit = async () => {
    if (!editTarget) return
    try {
      await updateMutation.mutateAsync({
        id: editTarget.id,
        role: editRole,
        fullName: editTarget.fullName,
      })
      addToast('success', 'Usuario actualizado')
      setEditTarget(null)
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error al actualizar usuario')
    }
  }

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    try {
      await deactivateMutation.mutateAsync(deactivateTarget.id)
      addToast('success', 'Usuario desactivado')
      setDeactivateTarget(null)
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error al desactivar usuario')
    }
  }

  const openEdit = (user: User) => {
    setEditTarget(user)
    setEditRole(user.role)
    setEditActive(user.isActive)
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iupa-green-light">
            <svg className="h-5 w-5 text-iupa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-iupa-dark">Usuarios</h1>
            <p className="text-xs text-iupa-medium">Gestioná los usuarios del sistema</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true) }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear usuario
        </Button>
      </div>

      {pendingUsers && pendingUsers.length > 0 && (
        <Card title="Solicitudes de acceso pendientes">
          <div className="divide-y divide-iupa-light">
            {pendingUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-100 shadow-sm">
                    <span className="text-sm font-bold text-yellow-700">{user.fullName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-iupa-dark">{user.fullName}</div>
                    <div className="text-xs text-iupa-medium">{user.email}</div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">Pendiente</span>
                  <button
                    onClick={async () => {
                      try {
                        await approveMutation.mutateAsync(user.id)
                        addToast('success', 'Usuario aprobado. Se envió un correo para que establezca su contraseña.')
                      } catch { addToast('error', 'Error al aprobar usuario') }
                    }}
                    className="rounded-lg bg-iupa-green px-3 py-1.5 text-xs font-medium text-white hover:bg-iupa-green-secondary transition-colors"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : 'Error al cargar usuarios'}
          </div>
        ) : !users || users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-iupa-green-light">
              <svg className="h-7 w-7 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-iupa-dark">No hay usuarios registrados</p>
            <p className="mt-1 text-xs text-iupa-medium">Creá el primer usuario para comenzar</p>
          </div>
        ) : (
          <div className="divide-y divide-iupa-light">
            {users.filter(u => u.isActive).map((user) => {
              const avatarBg = roleAvatarColors[user.role] ?? 'bg-iupa-medium'
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-5 py-4 transition-all duration-150 hover:bg-iupa-green-light/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm ${avatarBg}`}>
                      <span className="text-sm font-bold text-white drop-shadow-sm">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-iupa-dark">{user.fullName}</div>
                      <div className="text-xs text-iupa-medium">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={user.role.toLowerCase() as 'admin' | 'editor' | 'viewer'}>
                      {roleOptions.find((r) => r.value === user.role)?.label ?? user.role}
                    </Badge>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Activo
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-iupa-green-secondary hover:bg-iupa-green-light transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => setDeactivateTarget(user)}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Desactivar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear usuario"
        size="lg"
      >
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Nombre completo
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Juan Pérez"
              className="focus:ring-iupa-green/20"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Correo electrónico
            </label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="focus:ring-iupa-green/20"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Contraseña
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="focus:ring-iupa-green/20"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Rol
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as User['role'])}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 border-t border-iupa-light pt-4">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </Button>
            <Button onClick={handleCreate} loading={createMutation.isPending}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Crear
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Editar usuario"
        size="md"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-lg bg-iupa-green-light/40 px-4 py-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${roleAvatarColors[editTarget?.role ?? 'Viewer']}`}>
              <span className="text-sm font-bold text-white drop-shadow-sm">
                {editTarget?.fullName.charAt(0).toUpperCase() ?? '?'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-iupa-dark">{editTarget?.fullName}</p>
              <p className="text-xs text-iupa-medium">{editTarget?.email}</p>
            </div>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-iupa-dark">
              <svg className="h-4 w-4 text-iupa-green-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Rol
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as User['role'])}
              className="w-full rounded-lg border border-iupa-light bg-white px-3.5 py-2.5 text-sm text-iupa-dark focus:border-iupa-green focus:ring-2 focus:ring-iupa-green/20 focus:outline-none transition-all"
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-iupa-light px-4 py-3 text-sm text-iupa-dark hover:bg-iupa-green-light/20 transition-colors">
            <input
              type="checkbox"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
              className="h-4 w-4 rounded border-iupa-light text-iupa-green focus:ring-2 focus:ring-iupa-green/20"
            />
            <div>
              <span className="font-medium">Usuario activo</span>
              <p className="text-xs text-iupa-medium">Permitir que el usuario inicie sesión</p>
            </div>
          </label>
          <div className="flex justify-end gap-3 border-t border-iupa-light pt-4">
            <Button variant="ghost" onClick={() => setEditTarget(null)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </Button>
            <Button onClick={handleEdit} loading={updateMutation.isPending}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        title="Desactivar usuario"
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
              <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">
                ¿Desactivar a <strong>{deactivateTarget?.fullName}</strong>?
              </p>
              <p className="mt-1 text-xs text-red-600">
                El usuario no podrá iniciar sesión hasta que sea reactivado manualmente.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeactivateTarget(null)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeactivate} loading={deactivateMutation.isPending}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Desactivar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
