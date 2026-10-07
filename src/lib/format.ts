export function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

export function formatarData(data: string, incluirHora = false) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(incluirHora ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(data))
}

export function classePorTexto(texto: string, total = 4) {
  const valor = [...texto].reduce((acc, letra) => acc + letra.charCodeAt(0), 0)
  return valor % total
}

export function pluralizar(quantidade: number, singular: string, plural: string) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}
