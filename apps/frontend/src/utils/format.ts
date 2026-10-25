export function todayDate(now = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Douala', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now)
    return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-')
}

export function formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'})
        .format(new Date(date + 'T12:00:00Z'))
}

export function weight(value: number): string {
    return new Intl.NumberFormat('fr-FR', {maximumFractionDigits: 2}).format(value) + ' kg'
}

export const transportLabels = ['Brouillon', 'Validé', 'Parti'] as const
export const salesLabels = ['À planifier', 'Planifiée', 'En livraison'] as const

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.'
}
