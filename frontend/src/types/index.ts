export interface User { id: string; email: string; fullName: string; phone: string; roles: string[] }
export interface DashboardMetrics { totalMembers: number; newMembersThisMonth: number; attendanceRate: number; totalGiving: number; activeMinistries: number; upcomingEvents: number }
export interface Region { id: string; name: string; address: string; phone: string; email: string }
export interface Presbytery { id: string; name: string; address: string; phone: string; email: string; region: Region | null }
export interface Parish { id: string; name: string; address: string; phone: string; email: string; presbytery: Presbytery | null }
export interface Congregation { id: string; name: string; address: string; phone: string; email: string; parish: Parish | null }
