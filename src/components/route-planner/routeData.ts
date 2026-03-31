// Mock route coordinates for Helsinki area (Kamppi → Otaniemi)
// Each mode takes a slightly different path for visual distinction

export const mockRoutes: Record<string, [number, number][]> = {
  Cycling: [
    [60.1695, 24.9354], // Kamppi
    [60.1712, 24.9201],
    [60.1738, 24.9052],
    [60.1762, 24.8891],
    [60.1790, 24.8735],
    [60.1835, 24.8562],
    [60.1870, 24.8410],
    [60.1880, 24.8260],
    [60.1868, 24.8120],
    [60.1860, 24.8200], // Otaniemi
  ],
  Walking: [
    [60.1695, 24.9354],
    [60.1710, 24.9215],
    [60.1725, 24.9070],
    [60.1748, 24.8920],
    [60.1775, 24.8770],
    [60.1810, 24.8600],
    [60.1845, 24.8440],
    [60.1865, 24.8300],
    [60.1860, 24.8200],
  ],
  "HSL Transit": [
    [60.1695, 24.9354],
    [60.1680, 24.9250],
    [60.1670, 24.9100],
    [60.1660, 24.8950],
    [60.1680, 24.8780],
    [60.1720, 24.8600],
    [60.1780, 24.8420],
    [60.1830, 24.8300],
    [60.1860, 24.8200],
  ],
  "Private Car": [
    [60.1695, 24.9354],
    [60.1700, 24.9180],
    [60.1690, 24.8980],
    [60.1700, 24.8780],
    [60.1730, 24.8580],
    [60.1770, 24.8400],
    [60.1820, 24.8280],
    [60.1860, 24.8200],
  ],
};

// Mode colors matching design tokens
export const modeColors: Record<string, string> = {
  Cycling: "#1a9a7a",      // primary/cycling
  Walking: "#d94989",      // calorie
  "HSL Transit": "#6b5ce7", // competition
  "Private Car": "#d9952a", // accent
};
