import { Toaster } from 'sonner'
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader'

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StorefrontHeader />
      <main>{children}</main>
      <Toaster position="top-center" />
    </>
  )
}
