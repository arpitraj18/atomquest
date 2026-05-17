export function computeScore(
    uomType: 'min' | 'max' | 'timeline' | 'zero',
    target: number,
    achievement: number,
    deadline?: string,
    completionDate?: string
  ): number {
    if (!achievement || achievement === 0) return 0
    switch (uomType) {
      case 'min':
        return Math.min((achievement / target) * 100, 100)
      case 'max':
        return achievement === 0 ? 0 : Math.min((target / achievement) * 100, 100)
      case 'zero':
        return achievement === 0 ? 100 : 0
      case 'timeline':
        if (!deadline || !completionDate) return 0
        return new Date(completionDate) <= new Date(deadline) ? 100 : 0
      default:
        return 0
    }
  }
  