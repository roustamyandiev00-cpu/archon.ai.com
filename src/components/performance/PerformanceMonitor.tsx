'use client'

import { useEffect } from'react'

interface PerformanceMetrics {
 pageLoadTime: number
 firstContentfulPaint: number
 largestContentfulPaint: number
 cumulativeLayoutShift: number
}

export function PerformanceMonitor() {
 useEffect(() => {
 // Monitor Core Web Vitals
 const observer = new PerformanceObserver((list) => {
 for (const entry of list.getEntries()) {
 if (entry.entryType ==='navigation') {
 const navEntry = entry as PerformanceNavigationTiming
 console.log('Page Load Time:', navEntry.loadEventEnd - navEntry.fetchStart,'ms')
 }
 
 if (entry.entryType ==='paint') {
 console.log(`${entry.name}:`, entry.startTime,'ms')
 }
 
 if (entry.entryType ==='largest-contentful-paint') {
 console.log('LCP:', entry.startTime,'ms')
 }
 
 if (entry.entryType ==='layout-shift'&& !(entry as any).hadRecentInput) {
 console.log('CLS:', (entry as any).value)
 }
 }
 })

 // Observe verschillende performance metrics
 try {
 observer.observe({ entryTypes: ['navigation','paint','largest-contentful-paint','layout-shift'] })
 } catch (e) {
 // Fallback voor browsers die bepaalde metrics niet ondersteunen
 console.log('Performance monitoring niet volledig ondersteund')
 }

 return () => observer.disconnect()
 }, [])

 return null // Dit component rendert niets visueel
}

// Hook voor performance metrics
export function usePerformanceMetrics() {
 useEffect(() => {
 const measurePageLoad = () => {
 if (typeof window !=='undefined'&&'performance'in window) {
 const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
 
 if (navigation) {
 const metrics = {
 pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
 domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
 firstByte: navigation.responseStart - navigation.fetchStart,
 }
 
 // Log alleen in development
 if (process.env.NODE_ENV ==='development') {
 console.log('Performance Metrics:', metrics)
 }
 }
 }
 }

 // Meet performance na page load
 if (document.readyState ==='complete') {
 measurePageLoad()
 } else {
 window.addEventListener('load', measurePageLoad)
 return () => window.removeEventListener('load', measurePageLoad)
 }
 }, [])
}