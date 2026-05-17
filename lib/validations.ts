export type GoalInput = {
    weightage: number
    [key: string]: any
  }
  
  export function validateGoals(goals: GoalInput[]): string | null {
    if (goals.length > 8)
      return 'You cannot have more than 8 goals.'
    for (const g of goals) {
      if (Number(g.weightage) < 10)
        return 'Each goal must have at least 10% weightage.'
    }
    const total = goals.reduce((sum, g) => sum + Number(g.weightage), 0)
    if (Math.round(total) !== 100)
      return `Total weightage must equal 100%. Currently: ${total}%`
    return null
  }