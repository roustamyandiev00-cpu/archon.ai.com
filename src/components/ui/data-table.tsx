'use client'

import { useState, useMemo, useEffect } from'react'
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from'@/components/ui/table'
import { Input } from'@/components/ui/input'
import { Button } from'@/components/ui/button'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from'@/components/ui/select'
import { ChevronDown, ChevronUp, Search, ArrowUpDown, ChevronLeft, ChevronRight } from'lucide-react'

interface DataTableProps<T> {
 data: T[]
 columns: {
 key: keyof T
 header: string
 sortable?: boolean
 render?: (item: T) => React.ReactNode
 }[]
 searchFields?: (keyof T)[]
 onRowClick?: (item: T) => void
 actions?: (item: T) => React.ReactNode
 pageSize?: number
 pageSizeOptions?: number[]
}

export function DataTable<T extends Record<string, any>>({
 data,
 columns,
 searchFields = [],
 onRowClick,
 actions,
 pageSize = 10,
 pageSizeOptions = [5, 10, 25, 50, 100]
}: DataTableProps<T>) {
 const [searchTerm, setSearchTerm] = useState('')
 const [sortConfig, setSortConfig] = useState<{
 key: keyof T
 direction:'asc'|'desc'
 } | null>(null)
 const [currentPage, setCurrentPage] = useState(1)
 const [itemsPerPage, setItemsPerPage] = useState(pageSize)

 // Filter data based on search term
 const filteredData = useMemo(() => {
 if (!searchTerm || searchFields.length === 0) return data
 
 return data.filter((item) =>
 searchFields.some((field) => {
 const value = item[field]
 if (typeof value ==='string') {
 return value.toLowerCase().includes(searchTerm.toLowerCase())
 }
 return false
 })
 )
 }, [data, searchTerm, searchFields])

 // Sort data
 const sortedData = useMemo(() => {
 if (!sortConfig) return filteredData

 return [...filteredData].sort((a, b) => {
 const aValue = a[sortConfig.key]
 const bValue = b[sortConfig.key]

 if (aValue < bValue) return sortConfig.direction ==='asc'? -1 : 1
 if (aValue > bValue) return sortConfig.direction ==='asc'? 1 : -1
 return 0
 })
 }, [filteredData, sortConfig])

 // Paginate data
 const paginatedData = useMemo(() => {
 const start = (currentPage - 1) * itemsPerPage
 return sortedData.slice(start, start + itemsPerPage)
 }, [sortedData, currentPage, itemsPerPage])

 const totalPages = Math.ceil(sortedData.length / itemsPerPage)
 const totalItems = sortedData.length

 const handleSort = (key: keyof T) => {
 setSortConfig((current) => {
 if (current?.key === key) {
 return {
 key,
 direction: current.direction ==='asc'?'desc':'asc'
 }
 }
 return { key, direction:'asc'}
 })
 }

 const getSortIcon = (key: keyof T) => {
 if (sortConfig?.key !== key) return <ArrowUpDown className="h-4 w-4 ml-2"/>
 return sortConfig.direction ==='asc'
 ? <ChevronUp className="h-4 w-4 ml-2"/>
 : <ChevronDown className="h-4 w-4 ml-2"/>
 }

 const goToPage = (page: number) => {
 const validPage = Math.max(1, Math.min(page, totalPages || 1))
 setCurrentPage(validPage)
 }

 const handleItemsPerPageChange = (value: string) => {
 setItemsPerPage(Number(value))
 setCurrentPage(1)
 }

 return (
 <div className="space-y-4">
 {searchFields.length > 0 && (
 <div className="relative">
 <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
 <Input
 placeholder="Zoeken..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-10"
 />
 </div>
 )}

 <div className="rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 {columns.map((column) => (
 <TableHead key={String(column.key)}>
 {column.sortable ? (
 <Button
 variant="ghost"
 onClick={() => handleSort(column.key)}
 className="h-8 px-2 -ml-2 font-medium"
 >
 {column.header}
 {getSortIcon(column.key)}
 </Button>
 ) : (
 column.header
 )}
 </TableHead>
 ))}
 {actions && <TableHead>Acties</TableHead>}
 </TableRow>
 </TableHeader>
 <TableBody>
 {paginatedData.length > 0 ? (
 paginatedData.map((item, index) => (
 <TableRow
 key={index}
 onClick={() => onRowClick?.(item)}
 className={onRowClick ?'cursor-pointer hover:bg-muted':''}
 >
 {columns.map((column) => (
 <TableCell key={String(column.key)}>
 {column.render 
 ? column.render(item) 
 : String(item[column.key] ??'')}
 </TableCell>
 ))}
 {actions && (
 <TableCell onClick={(e) => e.stopPropagation()}>
 {actions(item)}
 </TableCell>
 )}
 </TableRow>
 ))
 ) : (
 <TableRow>
 <TableCell
 colSpan={columns.length + (actions ? 1 : 0)}
 className="h-24 text-center"
 >
 Geen resultaten gevonden
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>

 {totalItems > 0 && (
 <div className="flex items-center justify-between px-2">
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <span>
 Toont {(currentPage - 1) * itemsPerPage + 1} tot {Math.min(currentPage * itemsPerPage, totalItems)} van {totalItems} resultaten
 </span>
 </div>
 
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <span className="text-sm text-muted-foreground">Rijen per pagina:</span>
 <Select
 value={String(itemsPerPage)}
 onValueChange={handleItemsPerPageChange}
 >
 <SelectTrigger className="w-20 h-8">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {pageSizeOptions.map((size) => (
 <SelectItem key={size} value={String(size)}>
 {size}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="icon"
 className="h-8 w-8"
 onClick={() => goToPage(currentPage - 1)}
 disabled={currentPage === 1}
 >
 <ChevronLeft className="h-4 w-4"/>
 </Button>
 
 <span className="text-sm min-w-16 text-center">
 Pagina {currentPage} van {totalPages}
 </span>
 
 <Button
 variant="outline"
 size="icon"
 className="h-8 w-8"
 onClick={() => goToPage(currentPage + 1)}
 disabled={currentPage === totalPages}
 >
 <ChevronRight className="h-4 w-4"/>
 </Button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
