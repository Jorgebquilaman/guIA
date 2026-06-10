export const heroStats = [
  { value: '482', label: 'Trabajos disponibles', icon: 'FileText' },
  { value: '12', label: 'Carreras de grado', icon: 'GraduationCap' },
  { value: '356', label: 'Autores', icon: 'Users' },
  { value: '24.751', label: 'Descargas totales', icon: 'Download' },
]

export const departments = [
  {
    id: 'musica',
    name: 'Música',
    color: '#006A83',
    icon: 'Music',
    description: 'Producción musical, composición e interpretación',
  },
  {
    id: 'audiovisuales',
    name: 'Artes Audiovisuales',
    color: '#661012',
    icon: 'Video',
    description: 'Cine, televisión y medios digitales',
  },
  {
    id: 'visuales',
    name: 'Artes Visuales',
    color: '#CF2E2E',
    icon: 'Palette',
    description: 'Pintura, escultura y artes plásticas',
  },
  {
    id: 'movimiento',
    name: 'Artes del Movimiento',
    color: '#D81480',
    icon: 'Move',
    description: 'Danza, expresión corporal y coreografía',
  },
  {
    id: 'dramatico',
    name: 'Arte Dramático',
    color: '#FF6900',
    icon: 'Theater',
    description: 'Teatro, actuación y puesta en escena',
  },
]

export const recentWorks = [
  {
    id: '1',
    type: 'PDF' as const,
    title: 'El Arte como Artificio: desautomatización de la percepción estética',
    author: 'María Laura González',
    career: 'Licenciatura en Artes Visuales',
    year: 2025,
    views: 234,
  },
  {
    id: '2',
    type: 'MP4' as const,
    title: 'Ensayo coreográfico: cuerpo y espacio en la danza contemporánea',
    author: 'Facundo Molina',
    career: 'Tecnicatura en Danza',
    year: 2025,
    views: 189,
  },
  {
    id: '3',
    type: 'PDF' as const,
    title: 'La necesidad del arte en la sociedad contemporánea',
    author: 'Sofía Martínez',
    career: 'Licenciatura en Teatro',
    year: 2024,
    views: 312,
  },
  {
    id: '4',
    type: 'PDF' as const,
    title: 'Historia del Arte: función esencial en la construcción de identidad cultural',
    author: 'Juan Pablo Ríos',
    career: 'Profesorado de Artes Visuales',
    year: 2024,
    views: 156,
  },
]

export const tags = [
  'arte', 'música', 'teatro', 'composición', 'danza',
  'educación', 'audiovisual', 'performance', 'pintura', 'sonido',
]

export const newsItem = {
  title: 'Nueva convocatoria para publicaciones 2026',
  text: 'El IUPA abre la convocatoria para la presentación de trabajos académicos y artísticos correspondientes al ciclo 2026. Podrán participar docentes, estudiantes y egresados de todas las carreras.',
}

export const menuItems = [
  { label: 'Inicio', href: '/' },
]

export const navLinks = [
  { label: 'Accesibilidad', href: '#' },
  { label: 'Ayuda', href: '#' },
  { label: 'ES', href: '#' },
]

export const categories = [
  { value: '', label: 'Tipo de obra' },
  { value: 'article', label: 'Artículo' },
  { value: 'thesis', label: 'Tesis' },
  { value: 'dataset', label: 'Dataset' },
]

export const authorOptions = [
  { value: '', label: 'Autor/a' },
  { value: '1', label: 'María Laura González' },
  { value: '2', label: 'Facundo Molina' },
  { value: '3', label: 'Sofía Martínez' },
]

export const careerOptions = [
  { value: '', label: 'Carrera' },
  { value: 'visuales', label: 'Artes Visuales' },
  { value: 'danza', label: 'Danza' },
  { value: 'teatro', label: 'Teatro' },
]

export const yearOptions = [
  { value: '', label: 'Año' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
]

export const footerLinks = {
  contact: {
    address: 'Av. Siempre Viva 123, CP 8324, Cipolletti, Río Negro',
    phone: '+54 299 443-5678',
    email: 'repositorio@iupa.edu.ar',
  },
  usefulLinks: [
    { label: 'Políticas del repositorio', href: '#' },
    { label: 'Términos y condiciones', href: '#' },
    { label: 'Política de privacidad', href: '#' },
  ],
  helpLinks: [
    { label: 'Preguntas frecuentes', href: '#' },
    { label: 'Contacto', href: '#' },
    { label: 'Mapa del sitio', href: '#' },
  ],
  social: [
    { label: 'Facebook', icon: 'Facebook', href: '#' },
    { label: 'Instagram', icon: 'Instagram', href: '#' },
    { label: 'YouTube', icon: 'Youtube', href: '#' },
  ],
}
