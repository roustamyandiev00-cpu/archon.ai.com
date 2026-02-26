'use client'

import { useMemo } from'react'
import { useRouter } from'next/navigation'

import DashboardHome from'@/components/dashboard/DashboardHome'

const getFormattedDate = () =>
 new Date().toLocaleDateString('nl-NL', {
 weekday:'long',
 year:'numeric',
 month:'long',
 day:'numeric',
 })

function getPathForPage(page: string, withCreate = false): string {
 const normalizedPage = page.trim().toLowerCase()
 const targetPath = normalizedPage && normalizedPage !=='home'? `/${normalizedPage}` :'/dashboard'
 return withCreate ? `${targetPath}?create=1` : targetPath
}

export default function DashboardPage() {
 const router = useRouter()
 const formattedDate = useMemo(() => getFormattedDate(), [])

 const navigateTo = (page: string) => {
 router.push(getPathForPage(page))
 }

 const navigateToCreate = (page: string) => {
 router.push(getPathForPage(page, true))
 }

 const prefetchPage = (page?: string) => {
 if (!page) return
 void router.prefetch(getPathForPage(page))
 }

 return (
 <DashboardHome
 formattedDate={formattedDate}
 onNavigate={navigateTo}
 onNavigateWithCreate={navigateToCreate}
 onPrefetch={prefetchPage}
 />
 )
}
