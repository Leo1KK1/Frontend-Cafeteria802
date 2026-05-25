// Convierte fecha UTC a hora de Ciudad de México
export function horaCDMX(fechaISO) {
  if (!fechaISO) return '--:--';
  return new Date(fechaISO).toLocaleTimeString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
  });
}

export function fechaHoraCDMX(fechaISO) {
  if (!fechaISO) return '--';
  return new Date(fechaISO).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    day:      '2-digit',
    month:    'short',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
  });
}