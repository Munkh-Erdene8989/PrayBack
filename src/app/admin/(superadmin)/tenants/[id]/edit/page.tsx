'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function EditTenantPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    admin_username: '',
    admin_password: '',
    contact_phone: '',
    contact_email: '',
    is_active: true,
  })

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/tenants/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Tenant not found')
        return res.json()
      })
      .then(({ tenant }) => {
        setFormData({
          name: tenant.name ?? '',
          slug: tenant.slug ?? '',
          admin_username: tenant.admin_username ?? '',
          admin_password: '',
          contact_phone: tenant.contact_phone ?? '',
          contact_email: tenant.contact_email ?? '',
          is_active: tenant.is_active ?? true,
        })
      })
      .catch(() => {
        toast.error('Tenant олдсонгүй')
        router.push('/admin/tenants')
      })
      .finally(() => setLoading(false))
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: formData.name,
        slug: formData.slug,
        admin_username: formData.admin_username,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        is_active: formData.is_active,
      }
      if (formData.admin_password) {
        body.admin_password = formData.admin_password
      }

      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update tenant')
      }

      toast.success('Tenant амжилттай шинэчлэгдлээ')
      router.push('/admin/tenants')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Edit Tenant</h1>
        <Card className="max-w-2xl">
          <CardContent className="py-8">Ачаалж байна...</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Edit Tenant</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tenant Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (tenant identifier) *</Label>
              <Input
                id="slug"
                required
                placeholder="branch1"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Tenant identifier. All admins log in at merchant.mydomain.mn
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_username">Admin Username *</Label>
              <Input
                id="admin_username"
                required
                value={formData.admin_username}
                onChange={(e) => setFormData({ ...formData, admin_username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_password">Admin Password (шинэчлэх бол оруулна уу)</Label>
              <Input
                id="admin_password"
                type="password"
                placeholder="Хоосон үлдвэл өмнөх нууц үг хэвээр"
                value={formData.admin_password}
                onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="is_active">Идэвхтэй (Active)</Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/tenants">Буцах</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
