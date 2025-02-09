import L from 'leaflet'

export const createIcon = (color: string, index: number) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: ${color}; color: white; border-radius: 50%; padding: 4px 8px; text-align: center;">${index}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })
}