export type UserRole = 'employee' | 'manager' | 'admin'
export type UoMType = 'min' | 'max' | 'timeline' | 'zero'
export type GoalStatus = 'draft' | 'submitted' | 'approved' | 'returned'
export type CheckInStatus = 'not_started' | 'on_track' | 'completed'
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  manager_id?: string
  department?: string
  created_at: string
}

export interface Goal {
  id: string
  employee_id: string
  cycle_id: string
  thrust_area: string
  title: string
  description: string
  uom_type: UoMType
  target: number
  weightage: number
  status: GoalStatus
  locked_at?: string
  shared_from_goal_id?: string
  created_at: string
  employee?: User
}

export interface CheckIn {
  id: string
  goal_id: string
  quarter: Quarter
  actual_achievement: number
  completion_date?: string
  status: CheckInStatus
  manager_comment?: string
  checked_in_at: string
  goal?: Goal
}

export interface AuditLog {
  id: string
  entity_type: string
  entity_id: string
  changed_by: string
  change_type: string
  old_value: any
  new_value: any
  changed_at: string
}

export interface GoalCycle {
  id: string
  name: string
  phase1_opens: string
  q1_opens: string
  q2_opens: string
  q3_opens: string
  q4_opens: string
  is_active: boolean
}